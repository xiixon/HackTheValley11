import { prisma } from "../src/db/prisma";

type ScheduleRow = Awaited<ReturnType<typeof prisma.schedule.findMany>>[number];

// Find the current date, time and weekday (in the schedule's own timezone)
function localParts(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "long",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,   // "2026-10-17"
    time: `${get("hour")}:${get("minute")}`,                // "08:00"
    weekday: get("weekday").toLowerCase(),                  // "saturday"
  };
}

export type DueReminder = { schedule: ScheduleRow; localDate: string; time: string; offset: number };

function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function isScheduledOnDate(schedule: ScheduleRow, date: string) {
  if (date < schedule.startDate || (schedule.endDate && date > schedule.endDate)) return false;
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).toLowerCase();
  return schedule.frequency !== "weekly" || schedule.daysOfWeek.includes(weekday);
}

// A series of "skip it iff" checks to see if a schedule is due at the current time.
export function findDue(schedules: ScheduleRow[], now = new Date()): DueReminder[] {
  const due: DueReminder[] = [];

  for (const s of schedules) {
    let p;
    try {
      p = localParts(now, s.timezone);
    } catch {
      continue; // bad timezone in the database
    }

    const metadata = s.metadata && typeof s.metadata === "object" && !Array.isArray(s.metadata)
      ? s.metadata as { notificationOffsets?: unknown }
      : {};
    const offsets = Array.isArray(metadata.notificationOffsets) && metadata.notificationOffsets.length
      ? metadata.notificationOffsets.filter((offset): offset is number => Number.isInteger(offset))
      : [0];

    for (const doseDate of [p.date, shiftDate(p.date, -1)]) {
      if (!isScheduledOnDate(s, doseDate)) continue;
      for (const time of s.times) {
        const timeParts = time.split(":").map(Number);
        const hour = timeParts[0];
        const minute = timeParts[1];
        if (hour === undefined || minute === undefined || !Number.isInteger(hour) || !Number.isInteger(minute)) continue;
        const doseMinute = hour * 60 + minute;
        for (const offset of offsets) {
          const reminderMinute = doseMinute - offset;
          const reminderDate = shiftDate(doseDate, reminderMinute < 0 ? -1 : 0);
          const normalizedMinute = (reminderMinute + 1440) % 1440;
          const reminderTime = `${String(Math.floor(normalizedMinute / 60)).padStart(2, "0")}:${String(normalizedMinute % 60).padStart(2, "0")}`;
          if (reminderDate === p.date && reminderTime === p.time) {
            due.push({ schedule: s, localDate: doseDate, time, offset });
          }
        }
      }
    }
  }

  return due;
}