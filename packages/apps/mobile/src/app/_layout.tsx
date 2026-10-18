import { DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';

import { AuthProvider, useAuth } from '../auth/AuthContext';
import { ProfileMenu } from '../components/navigation/ProfileMenu';
import { WebTabs } from '../components/navigation/WebTabs';
import { MedicationProvider } from '../context/MedicationContext';
import { colors } from '../theme/colors';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        <Navigation />
      </ThemeProvider>
    </AuthProvider>
  );
}

function Navigation() {
  const { session, authenticatedFetch } = useAuth();
  const signedIn = !!session;

  useEffect(() => {
    if (
      !signedIn ||
      Platform.OS === 'web' ||
      Constants.appOwnership === 'expo'
    ) return;
    let active = true;
    const notifications = async () => {
      const Notifications: typeof NotificationsModule = await import('expo-notifications');
      if (!active) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      const permissions = await Notifications.getPermissionsAsync();
      const granted = permissions.granted || (await Notifications.requestPermissionsAsync()).granted;
      if (!granted || !active) return undefined;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication-reminders', {
          name: 'Medication reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }
      await Notifications.setNotificationCategoryAsync('medication-reminder', [
        { identifier: 'snooze', buttonTitle: 'Snooze 10 minutes', options: { opensAppToForeground: false } },
        { identifier: 'dismiss', buttonTitle: 'Dismiss', options: { isDestructive: true } },
      ]);
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
      })).data;
      await authenticatedFetch('/push-tokens', { method: 'POST', body: JSON.stringify({ token }) });

      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        if (response.actionIdentifier !== 'snooze') return;
        const content = response.notification.request.content;
        void Notifications.scheduleNotificationAsync({
          content: {
            title: `${content.title ?? 'Medication'} (snoozed)`,
            body: content.body ?? undefined,
            data: { ...content.data, snoozed: true },
            sound: content.sound ?? undefined,
            categoryIdentifier: content.categoryIdentifier ?? undefined,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 600 },
        });
      });

      return responseSubscription;
    };
    let responseSubscription: { remove: () => void } | undefined;
    void notifications()
      .then((subscription) => { responseSubscription = subscription; })
      .catch((error) => console.warn('Unable to register medication notifications', error));
    return () => { active = false; responseSubscription?.remove(); };
  }, [authenticatedFetch, signedIn]);

  return (
    <MedicationProvider key={session?.user.id ?? 'signed-out'}>
      <View style={{ flex: 1 }}>
        {signedIn && <ProfileMenu />}
        {Platform.OS === 'web' ? <WebTabs signedIn={signedIn} /> : <NativeTabs
          hidden={!signedIn}
          tintColor={colors.primary}
          backgroundColor={colors.surface}
          iconColor={{ default: colors.textMuted, selected: colors.primary }}
          labelStyle={{
            default: { color: colors.textMuted },
            selected: { color: colors.primary },
          }}
          minimizeBehavior="never"
        >
          {/* Hidden native tab routes are excluded from navigation, including direct links. */}
          <NativeTabs.Trigger name="login" hidden={signedIn}>
            <NativeTabs.Trigger.Label>Sign in</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="index" hidden={!signedIn}>
            <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="schedule" hidden={!signedIn}>
            <NativeTabs.Trigger.Label>Schedule</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="chat" hidden={!signedIn} disableAutomaticContentInsets>
            <NativeTabs.Trigger.Label>IntelliMed</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" md="chat" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="history" hidden={!signedIn}>
            <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" md="history" />
          </NativeTabs.Trigger>
        </NativeTabs>}
      </View>
    </MedicationProvider>
  );
}
