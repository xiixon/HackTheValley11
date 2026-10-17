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

export type DueReminder = { schedule: ScheduleRow; localDate: string; time: string };

export function findDue(schedules: ScheduleRow[], now = new Date()): DueReminder[] {
  const due: DueReminder[] = [];

  for (const s of schedules) {
    let p;
    try {
      p = localParts(now, s.timezone);
    } catch {
      continue; // bad timezone in the database: skip instead of crashing the job
    }

    if (p.date < s.startDate) continue;                        // hasn't started
    if (s.endDate && p.date > s.endDate) continue;             // already ended
    if (s.frequency === "weekly" && !s.daysOfWeek.includes(p.weekday)) continue;
    if (!s.times.includes(p.time)) continue;                   // not due this minute

    due.push({ schedule: s, localDate: p.date, time: p.time });
  }

  return due;
}