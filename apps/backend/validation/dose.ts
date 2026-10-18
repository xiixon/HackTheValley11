import { isValidDate, isValidTime } from '../../../packages/shared/src/types/Schedule';
import { occursOnDate, type ReminderSchedule } from '../../../packages/shared/src/reminders';

export function isScheduledDose(schedule: ReminderSchedule, date: string, time: string) {
  if (!isValidDate(date) || !isValidTime(time) || !schedule.times.includes(time)) return false;
  if (schedule.frequency === 'as_needed') {
    return schedule.isActive !== false && date >= schedule.startDate && (!schedule.endDate || date <= schedule.endDate);
  }
  return occursOnDate(schedule, date);
}
