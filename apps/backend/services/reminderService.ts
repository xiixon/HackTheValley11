import type { ReminderSchedule } from '../../../packages/shared/src/reminders';
import { doseTaken, localParts, occursOnDate, reminderOffsets, shiftDate } from '../../../packages/shared/src/reminders';

type DueReminder<T> = { schedule: T; localDate: string; time: string; offset: number };

export function findDue<T extends ReminderSchedule>(schedules: T[], now = new Date()): DueReminder<T>[] {
  const due: DueReminder<T>[] = [];
  for (const schedule of schedules) {
    try {
      const local = localParts(now, schedule.timezone);
      // An advance reminder for a dose just after midnight belongs to tomorrow.
      for (const date of [local.date, shiftDate(local.date, 1)]) {
        if (!occursOnDate(schedule, date)) continue;
        for (const time of new Set(schedule.times)) {
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || doseTaken(schedule, date, time)) continue;
          const [hour, minute] = time.split(':').map(Number) as [number, number];
          for (const offset of reminderOffsets(schedule.metadata)) {
            const reminderMinute = hour * 60 + minute - offset;
            const reminderDate = reminderMinute < 0 ? shiftDate(date, -1) : date;
            const normalized = (reminderMinute + 1440) % 1440;
            const reminderTime = `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
            if (reminderDate === local.date && reminderTime === local.time) {
              due.push({ schedule, localDate: date, time, offset });
            }
          }
        }
      }
    } catch { /* Invalid timezone in a legacy schedule. */ }
  }
  return due;
}
