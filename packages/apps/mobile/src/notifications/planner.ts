import { doseTaken, localParts, occursOnDate, reminderOffsets, shiftDate, zonedDate, type ReminderSchedule } from '../../../../shared/src/reminders';

export type NotificationSchedule = ReminderSchedule & {
  medicationId?: string;
  medication: { genericName: string; brandName: string };
};

export function planReminders(schedules: NotificationSchedule[], now = new Date(), limit = 60) {
  const reminders = [];
  for (const schedule of schedules) {
    try {
      const today = localParts(now, schedule.timezone).date;
      const start = today > schedule.startDate ? today : schedule.startDate;
      const initialCount = reminders.length;
      for (let day = 0; day <= 366; day++) {
        if (reminders.length - initialCount >= limit) break;
        const date = shiftDate(start, day);
        if (schedule.endDate && date > schedule.endDate) break;
        if (!occursOnDate(schedule, date)) continue;
        for (const time of new Set(schedule.times)) {
          if (doseTaken(schedule, date, time)) continue;
          const doseDate = zonedDate(date, time, schedule.timezone);
          if (!doseDate) continue;
          for (const offset of reminderOffsets(schedule.metadata)) {
            const fireDate = new Date(doseDate.getTime() - offset * 60000);
            if (fireDate <= now) continue;
            const metadata = schedule.metadata as { notificationSound?: string } | null;
            reminders.push({
              identifier: `medimobi:${schedule.id}:${date}:${time}:${offset}`,
              date: fireDate,
              title: `${schedule.medication.brandName || schedule.medication.genericName} reminder`,
              body: offset ? `Take your medication in ${offset} minute${offset === 1 ? '' : 's'}.` : 'It is time to take your medication.',
              sound: metadata?.notificationSound !== 'silent',
              data: { scheduleId: schedule.id, medicationId: schedule.medicationId, localDate: date, time, offset },
            });
          }
        }
      }
    } catch {
      // A malformed legacy schedule must not prevent other medicines' reminders.
    }
  }
  // iOS allows 64 pending local notifications. Leave room for snoozes.
  return reminders.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}
