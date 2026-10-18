import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as NotificationAPI from 'expo-notifications';
import type * as NotificationModule from 'expo-notifications';
import { useAuth } from '../auth/AuthContext';
import { planReminders, type NotificationSchedule } from './planner';
import { doseTaken, occursOnDate } from '../../../../shared/src/reminders';

// Serialize replacements, including sign-out cleanup, so an older request cannot
// recreate reminders after the next signed-in user's schedules have loaded.
let queue = Promise.resolve();
function enqueue(task: () => Promise<void>) {
  queue = queue.then(task).catch((error) => console.warn('Unable to update medication reminders', error));
  return queue;
}

async function cancelMedicationReminders(Notifications: typeof NotificationModule) {
  for (const request of await Notifications.getAllScheduledNotificationsAsync()) {
    if (request.identifier.startsWith('medimobi:')) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }
}

export function useMedicationNotifications(schedules: NotificationSchedule[]) {
  const { session, authenticatedFetch } = useAuth();
  const latest = useRef(schedules);
  const synchronize = useRef<(() => void) | null>(null);
  useEffect(() => { latest.current = schedules; synchronize.current?.(); }, [schedules]);

  useEffect(() => {
    if (!session || Platform.OS === 'web') return;
    let active = true;
    let Notifications: typeof NotificationModule | undefined;
    let pushToken: string | undefined;
    let responseListener: { remove: () => void } | undefined;
    let foregroundListener: { remove: () => void } | undefined;
    const userId = session.user.id;
    const setup = async () => {
      Notifications = NotificationAPI;
      const api = Notifications;
      if (!active) return;
      api.setNotificationHandler({
        handleNotification: async (notification) => ({
          shouldPlaySound: !!notification.request.content.sound,
          shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true,
        }),
      });
      // On Android a channel must exist before requesting permission.
      if (Platform.OS === 'android') {
        await api.setNotificationChannelAsync('medication-reminders', {
          name: 'Medication reminders', importance: api.AndroidImportance.HIGH, sound: 'default',
        });
        await api.setNotificationChannelAsync('medication-reminders-silent', {
          name: 'Silent medication reminders', importance: api.AndroidImportance.HIGH, sound: null,
        });
      }
      let permission = await api.getPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) permission = await api.requestPermissionsAsync();
      if (!active || !permission.granted) return;
      await api.setNotificationCategoryAsync('medication-reminder', [
        { identifier: 'snooze', buttonTitle: 'Snooze 10 minutes', options: { opensAppToForeground: true } },
        { identifier: 'dismiss', buttonTitle: 'Dismiss', options: { isDestructive: true } },
      ]);
      if (!active) return;
      const handledResponses = new Set<string>();
      const respond = (response: NotificationModule.NotificationResponse) => {
        if (!active) return;
        const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
        if (handledResponses.has(responseKey)) return;
        handledResponses.add(responseKey);
        const content = response.notification.request.content;
        if (content.data?.userId && content.data.userId !== userId) return;
        if (response.actionIdentifier === 'snooze') {
          void enqueue(async () => {
            if (!active) return;
            const sound = !!content.sound;
            await api.scheduleNotificationAsync({
              identifier: `medimobi:snooze:${response.notification.request.identifier}`,
              content: {
                title: content.title ?? 'Medication reminder', body: 'It is time to take your medication.',
                data: { ...content.data, userId, snoozed: true }, sound: sound ? 'default' : false,
                categoryIdentifier: 'medication-reminder',
              },
              trigger: {
                type: api.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 600,
                channelId: sound ? 'medication-reminders' : 'medication-reminders-silent',
              },
            });
          });
        } else if (response.actionIdentifier === api.DEFAULT_ACTION_IDENTIFIER) {
          router.navigate('/schedule');
        }
        void api.clearLastNotificationResponseAsync();
      };
      // Listen even if remote token registration fails or Expo Go is in use.
      responseListener = api.addNotificationResponseReceivedListener(respond);
      const lastResponse = await api.getLastNotificationResponseAsync();
      if (lastResponse) respond(lastResponse);
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      let remote = false;
      if (Constants.appOwnership !== 'expo' && projectId) {
        try {
          pushToken = (await api.getExpoPushTokenAsync({ projectId })).data;
          if (!active) return;
          await authenticatedFetch('/push-tokens', { method: 'POST', body: JSON.stringify({ token: pushToken }) });
          if (!active) {
            await authenticatedFetch('/push-tokens', { method: 'DELETE', body: JSON.stringify({ token: pushToken }) });
            return;
          }
          remote = true;
        } catch (error) {
          console.warn('Using on-device reminders because push registration is unavailable', error);
        }
      }
      if (!active) return;
      if (remote) {
        await enqueue(() => cancelMedicationReminders(api));
        return;
      }
      const sync = () => {
        void enqueue(async () => {
          if (!active) return;
          const existing = await api.getAllScheduledNotificationsAsync();
          const desired = planReminders(latest.current);
          const ids = new Set(desired.map((reminder) => reminder.identifier));
          for (const request of existing) {
            const data = request.content.data;
            const schedule = latest.current.find((item) => item.id === data?.scheduleId);
            const validSnooze = request.identifier.startsWith('medimobi:snooze:') && schedule &&
              typeof data?.localDate === 'string' && typeof data?.time === 'string' &&
              occursOnDate(schedule, data.localDate) && schedule.times.includes(data.time) &&
              !doseTaken(schedule, data.localDate, data.time);
            if (request.identifier.startsWith('medimobi:') && !validSnooze && !ids.has(request.identifier)) {
              await api.cancelScheduledNotificationAsync(request.identifier);
            }
          }
          for (const reminder of desired) {
            if (!active) return;
            await api.scheduleNotificationAsync({
              identifier: reminder.identifier,
              content: {
                title: reminder.title, body: reminder.body, data: { ...reminder.data, userId },
                sound: reminder.sound ? 'default' : false, categoryIdentifier: 'medication-reminder',
              },
              trigger: {
                type: api.SchedulableTriggerInputTypes.DATE, date: reminder.date,
                channelId: reminder.sound ? 'medication-reminders' : 'medication-reminders-silent',
              },
            });
          }
        });
      };
      synchronize.current = sync;
      foregroundListener = AppState.addEventListener('change', (state) => { if (state === 'active') sync(); });
      sync();
    };
    void setup().catch((error) => console.warn('Unable to enable medication reminders', error));
    return () => {
      active = false;
      synchronize.current = null;
      responseListener?.remove();
      foregroundListener?.remove();
      if (Notifications) void enqueue(() => cancelMedicationReminders(Notifications!));
      if (pushToken) void authenticatedFetch('/push-tokens', {
        method: 'DELETE', body: JSON.stringify({ token: pushToken }),
      }).catch((error) => console.warn('Unable to unregister push reminders', error));
    };
  }, [authenticatedFetch, session]);
}
