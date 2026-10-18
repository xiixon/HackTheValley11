import type { Medication, MedicationFormValues } from '../types/medication';
import { occursOnDate, shiftDate } from '../../../../shared/src/reminders';

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const frequencyMap: Record<string, string> = {
  Daily: "daily", Weekly: "weekly", "Selected days": "selected_days",
  "Every N days": "every_n_days", Monthly: "monthly", Once: "once", "As needed": "as_needed", "Once daily": "once_daily",
};

export type BackendSchedule = {
  id: string;
  timezone: string;
  isActive: boolean;
  medicationId: string;
  medication: {
    id: string;
    genericName: string;
    brandName: string;
    ingredients: { name: string; strengthMg?: number; strength?: number }[];
    purposes: string[];
    dosageForm: MedicationFormValues["dosageForm"];
    frequency?: string | null;
    doseAmount?: number | null;
    warning: string[];
    avoidWithConditions: string[];
    avoidWithIngredients: string[];
  };
  times: string[];
  startDate: string;
  endDate?: string | null;
  frequency: string;
  daysOfWeek: string[];
  intervalDays?: number | null;
  metadata?: { doseAmount?: number; catalogMedicationId?: string; color?: string; notes?: string; reminderTimes?: string[]; selectedWeekdays?: number[]; notificationOffsets?: number[]; notificationSound?: 'default' | 'silent' } | null;
  doseLogs: { localDate: string; time: string; takenAt?: string | null }[];
};


export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function time24(value: string) {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return value;
  let hour = Number(match[1]) % 12;
  if (match[3]!.toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2] ?? "00"}`;
}

function time12(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

function mapMedication(schedule: BackendSchedule): MedicationFormValues {
  const medication = schedule.medication;
  const catalogMedicationId = schedule.metadata?.catalogMedicationId ?? (!medication.id.startsWith("custom-") ? medication.id : undefined);
  return {
    id: medication.id,
    ...(catalogMedicationId ? { catalogMedicationId } : {}),
    genericName: medication.genericName,
    brandName: medication.brandName,
    ingredients: (medication.ingredients ?? []).map((ingredient) => ({
      name: ingredient.name,
      strength: ingredient.strength ?? ingredient.strengthMg ?? 0,
    })),
    purposes: medication.purposes,
    dosageForm: medication.dosageForm,
    Frequency: Object.entries(frequencyMap).find(([, value]) => value === schedule.frequency)?.[0] ?? "Daily",
    doseAmount: schedule.metadata?.doseAmount ?? medication.doseAmount ?? 1,
    warning: medication.warning,
    avoidWithConditions: medication.avoidWithConditions,
    avoidWithIngredients: medication.avoidWithIngredients,
    time: schedule.times[0] ? time12(schedule.times[0]) : "12:00 AM",
    color: schedule.metadata?.color ?? "#6D8D78",
    startDate: schedule.startDate,
    endDate: schedule.endDate ?? "",
    notes: schedule.metadata?.notes ?? "",
    reminderTimes: schedule.times.map(time12),
    notificationOffsets: schedule.metadata?.notificationOffsets ?? [0],
    notificationSound: schedule.metadata?.notificationSound ?? "default",
    selectedWeekdays: schedule.metadata?.selectedWeekdays ?? schedule.daysOfWeek.map((day) => dayNames.indexOf(day)),
    intervalDays: schedule.intervalDays ?? 1,
  };
}

export function expand(schedule: BackendSchedule, now = new Date()) {
  if (!schedule.isActive) return {};
  const output: Record<string, Medication[]> = {};
  const today = dateKey(now);
  // Keep a rolling calendar instead of truncating old recurring schedules before today.
  const first = [schedule.startDate, shiftDate(today, -366)].sort().at(-1)!;
  const last = [schedule.endDate ?? shiftDate(today, 366), shiftDate(today, 366)].sort()[0]!;
  const dates = new Set<string>();
  for (let key = first; key <= last; key = shiftDate(key, 1)) dates.add(key);
  // Recorded doses remain available in History even outside the calendar window.
  schedule.doseLogs.forEach(log => { if (log.takenAt) dates.add(log.localDate); });
  for (const key of [...dates].sort()) {
    if (!occursOnDate(schedule, key) && !(schedule.frequency === "as_needed" && key >= schedule.startDate && (!schedule.endDate || key <= schedule.endDate))) continue;
    output[key] = (schedule.times.length ? schedule.times : ["00:00"]).map((time) => {
      const taken = schedule.doseLogs.find((log) => log.localDate === key && log.time === time && !!log.takenAt);
      return {
        ...mapMedication(schedule),
        id: `${schedule.id}|${key}|${encodeURIComponent(time)}`,
        medicationId: schedule.medication.id,
        time: time12(time),
        scheduledDate: key,
        status: taken ? "taken" : "upcoming",
        ...(taken?.takenAt ? { takenAt: taken.takenAt } : {}),
        dosage: [
          (schedule.medication.ingredients ?? []).map((ingredient) => `${ingredient.strength ?? ingredient.strengthMg ?? 0} mg`).join(" + "),
          `${schedule.metadata?.doseAmount ?? schedule.medication.doseAmount ?? 1} ${schedule.medication.dosageForm}${(schedule.metadata?.doseAmount ?? schedule.medication.doseAmount ?? 1) === 1 ? "" : "s"}`,
        ].filter(Boolean).join(" · "),
        color: schedule.metadata?.color ?? "#6D8D78",
      };
    });
  }
  return output;
}
