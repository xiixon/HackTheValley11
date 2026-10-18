/** Calendar rules shared by server pushes and on-device reminders. */
export type ReminderSchedule = {
  id: string;
  times: string[];
  startDate: string;
  endDate?: string | null;
  frequency: string;
  daysOfWeek: string[];
  intervalDays?: number | null;
  timezone: string;
  isActive?: boolean;
  metadata?: unknown;
  doseLogs?: { localDate: string; time: string; takenAt?: string | Date | null }[];
};

export function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function localParts(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}`, second: get('second') };
}

export function occursOnDate(schedule: ReminderSchedule, date: string) {
  if (schedule.isActive === false || date < schedule.startDate || (schedule.endDate && date > schedule.endDate)) return false;
  const day = new Date(`${date}T12:00:00Z`);
  switch (schedule.frequency) {
    case 'daily': case 'once_daily': return true;
    case 'once': return date === schedule.startDate;
    case 'weekly': case 'selected_days':
      return schedule.daysOfWeek.includes(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getUTCDay()]!);
    case 'every_n_days': {
      const interval = schedule.intervalDays ?? 1;
      return interval > 0 && Math.round((day.getTime() - new Date(`${schedule.startDate}T12:00:00Z`).getTime()) / 86400000) % interval === 0;
    }
    case 'monthly': return date.slice(8) === schedule.startDate.slice(8);
    default: return false; // As-needed medicines have no scheduled reminder.
  }
}

export function reminderOffsets(metadata: unknown): number[] {
  const value = metadata && typeof metadata === 'object' && 'notificationOffsets' in metadata
    ? metadata.notificationOffsets : undefined;
  return [...new Set(Array.isArray(value) && value.length
    ? value.filter((offset): offset is number => Number.isInteger(offset) && [0, 1, 2, 5, 10, 15, 30, 60].includes(offset))
    : [0])];
}

export function doseTaken(schedule: ReminderSchedule, date: string, time: string) {
  return schedule.doseLogs?.some((log) => log.localDate === date && log.time === time && !!log.takenAt) ?? false;
}

/** Resolve a wall-clock time in its IANA zone, including daylight-saving changes. */
export function zonedDate(date: string, time: string, timeZone: string) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  let instant = wall;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = localParts(new Date(instant), timeZone);
    const represented = Date.parse(`${parts.date}T${parts.time}:${parts.second}Z`);
    const adjustment = wall - represented;
    if (!adjustment) return new Date(instant);
    instant += adjustment;
  }
  return null; // A nonexistent clock time during the spring DST transition.
}
