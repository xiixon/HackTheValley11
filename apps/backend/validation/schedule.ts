import {
  hasValidDateRange,
  hasValidTimes,
} from "../../../packages/shared/src/types/Schedule.js";
import { shiftDate } from '../../../packages/shared/src/reminders';

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const FREQUENCIES = ["daily", "weekly", "selected_days", "every_n_days", "monthly", "once", "as_needed", "once_daily"];

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

  const metadata = input.metadata;
  if (metadata != null && (typeof metadata !== "object" || Array.isArray(metadata))) {
    errors.push("metadata must be an object");
  } else if (metadata?.notificationOffsets != null &&
      (!Array.isArray(metadata.notificationOffsets) ||
        metadata.notificationOffsets.length === 0 ||
        !metadata.notificationOffsets.every((offset: unknown) =>
          Number.isInteger(offset) && [0, 1, 2, 5, 10, 15, 30, 60].includes(offset as number)))) {
    errors.push("metadata.notificationOffsets must contain one or more supported minute offsets");
  }
  if (metadata?.doseAmount != null &&
      (typeof metadata.doseAmount !== "number" || !Number.isFinite(metadata.doseAmount) || metadata.doseAmount <= 0)) {
    errors.push("metadata.doseAmount must be a positive number");
  }
  if (metadata?.notificationSound != null &&
      !["default", "silent"].includes(metadata.notificationSound)) {
    errors.push("metadata.notificationSound must be default or silent");
  }

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
  if (!FREQUENCIES.includes(input.frequency)) {
    errors.push(`frequency must be one of ${FREQUENCIES.join(", ")}`);
  } else {
    const days = input.daysOfWeek ?? [];
    if (!Array.isArray(days) || !days.every((d: unknown) => DAYS.includes(d as string))) {
      errors.push("daysOfWeek must be lowercase day names, for example monday");
    } else {
      if (["weekly", "selected_days"].includes(input.frequency) && days.length === 0) {
        errors.push("weekly and selected-day schedules need at least one day");
      }
      if (["weekly", "selected_days"].includes(input.frequency) && days.length &&
          typeof input.startDate === 'string' && typeof input.endDate === 'string' && hasValidDateRange(input.startDate, input.endDate)) {
        let hasDose = false;
        for (let offset = 0; offset < 7; offset++) {
          const date = shiftDate(input.startDate, offset);
          if (date > input.endDate) break;
          if (days.includes(DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()])) hasDose = true;
        }
        if (!hasDose) errors.push('No selected weekday falls within these dates. Extend the end date or choose a weekday in the date range.');
      }
      if (!["weekly", "selected_days"].includes(input.frequency) && days.length > 0) {
        errors.push("this frequency must not include daysOfWeek");
      }
    }
  }

  if (input.frequency === "every_n_days" &&
      (!Number.isInteger(input.intervalDays) || input.intervalDays < 1)) {
    errors.push("intervalDays must be a positive integer for every_n_days schedules");
  }

  // timezone
  if (!isValidTimezone(input.timezone)) {
    errors.push("timezone must be a valid IANA name, for example America/Toronto");
  }

  return errors;
}
