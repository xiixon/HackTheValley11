
export type ScheduleTime = string; // "HH:mm", 24-hour format (needs to be validated)
export type ScheduleDate = string; // "YYYY-MM-DD" (also needs to be validated)

export type ScheduleFrequency = "daily" | "weekly";

export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

// This is a list of fields that Schedule MUST contain!
interface BaseSchedule {
  id: string; // Unique identifier for this schedule
  medicationId: string; // Identifies which medication the schedule belongs to
  times: ScheduleTime[]; // The times when reminders should happen
  startDate: ScheduleDate; // Date the schedule begins
  endDate?: ScheduleDate; // Optional date the schedule ends
  isActive: boolean; // Whether the schedule is enabled
}

// Offers a daily and a weekly schedule option
export type Schedule =
  | (BaseSchedule & {
      frequency: "daily";
      daysOfWeek?: never;
    })
  | (BaseSchedule & {
      frequency: "weekly";
      daysOfWeek: DayOfWeek[];
    });

// Checks whether a time follows HH:mm format and represents a valid 24-hour time
export function isValidTime(time: string): boolean {
  const pieces = time.split(":"); // Splits time like "08:27" to ["08", "27"]

  if (pieces.length !== 2) {
    // Checks pieces is correctly of the format HH:mm
    return false;
  }

  if (pieces[0].length !== 2 || pieces[1].length !== 2) {
    return false;
  }

  // Ensures both pieces contain digits only
  if (!/^\d{2}$/.test(pieces[0]) || !/^\d{2}$/.test(pieces[1])) {
    return false;
  }

  const hours = Number(pieces[0]);
  const minutes = Number(pieces[1]);

  if (hours < 0 || hours > 23) {
    return false;
  }

  if (minutes < 0 || minutes > 59) {
    return false;
  }

  return true; // Passed all tests
}

// Checks whether a date is real and follows YYYY-MM-DD
export function isValidDate(date: string): boolean {
  // Strings of the form YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  // Rejects impossible dates, such as February 30
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
}

// Make sure that at least one day is selected if the schedule is of the weekly type
export function hasValidDays(
  frequency: ScheduleFrequency,
  days: DayOfWeek[]
): boolean {
  if (frequency === "weekly" && days.length === 0) {
    return false;
  }

  return true;
}

// Makes sure the end date is not before the start date
export function hasValidDateRange(
  startDate: ScheduleDate,
  endDate?: ScheduleDate
): boolean {
  if (!isValidDate(startDate)) {
    return false;
  }

  if (endDate === undefined) {
    return true;
  }

  if (!isValidDate(endDate)) {
    return false;
  }

  return endDate >= startDate;
}

// Makes sure there is at least one reminder time and all times are valid
export function hasValidTimes(times: ScheduleTime[]): boolean {
  return times.length > 0 && times.every(isValidTime);
}
