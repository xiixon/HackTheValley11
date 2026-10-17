import {
  hasValidDateRange,
  hasValidDays,
  hasValidTimes,
} from "../../../packages/shared/src/types/Schedule.js";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function isValidTimezone(tz: unknown): boolean {
  if (typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function validateScheduleInput(input: Record<string, any>): string[] {
  const errors: string[] = [];

  // times: check the type first, then use your validator
  if (!Array.isArray(input.times) || !input.times.every((t: unknown) => typeof t === "string")) {
    errors.push("times must be an array of HH:mm strings");
  } else if (!hasValidTimes(input.times)) {
    errors.push("times must have at least one entry, each in 24-hour HH:mm format");
  }

  // dates
  if (typeof input.startDate !== "string") {
    errors.push("startDate is required (YYYY-MM-DD)");
  } else if (input.endDate != null && typeof input.endDate !== "string") {
    errors.push("endDate must be a YYYY-MM-DD string");
  } else if (!hasValidDateRange(input.startDate, input.endDate ?? undefined)) {
    errors.push("dates must be real YYYY-MM-DD dates, and endDate must not be before startDate");
  }

  // frequency and days
  if (input.frequency !== "daily" && input.frequency !== "weekly") {
    errors.push('frequency must be "daily" or "weekly"');
  } else {
    const days = input.daysOfWeek ?? [];
    if (!Array.isArray(days) || !days.every((d: unknown) => DAYS.includes(d as string))) {
      errors.push("daysOfWeek must be lowercase day names, for example monday");
    } else {
      if (!hasValidDays(input.frequency, days)) errors.push("weekly schedules need at least one day");
      if (input.frequency === "daily" && days.length > 0) {
        errors.push("daily schedules must not include daysOfWeek");
      }
    }
  }

  // timezone
  if (!isValidTimezone(input.timezone)) {
    errors.push("timezone must be a valid IANA name, for example America/Toronto");
  }

  return errors;
}