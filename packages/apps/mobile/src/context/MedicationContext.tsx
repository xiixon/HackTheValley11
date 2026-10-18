import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Medication, MedicationFormValues } from "../types/medication";

type BackendSchedule = {
  id: string;
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
  metadata?: { color?: string; notes?: string; reminderTimes?: string[]; selectedWeekdays?: number[] } | null;
  doseLogs: { localDate: string; time: string; takenAt?: string | null }[];
};

type MedicationContextValue = {
  medicationsByDate: Record<string, Medication[]>;
  cycleMedicationStatus: (id: string) => Promise<void>;
  addMedication: (date: Date, medication: MedicationFormValues) => Promise<void>;
  updateMedication: (id: string, medication: MedicationFormValues) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
};

const MedicationContext = createContext<MedicationContextValue | undefined>(undefined);
const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const frequencyMap: Record<string, string> = {
  Daily: "daily", Weekly: "weekly", "Selected days": "selected_days",
  "Every N days": "every_n_days", Monthly: "monthly", Once: "once", "As needed": "as_needed",
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function time24(value: string) {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return value;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2] ?? "00"}`;
}

function time12(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

function mapMedication(schedule: BackendSchedule): MedicationFormValues {
  const medication = schedule.medication;
  return {
    id: medication.id,
    genericName: medication.genericName,
    brandName: medication.brandName,
    ingredients: medication.ingredients.map((ingredient) => ({
      name: ingredient.name,
      strength: ingredient.strength ?? ingredient.strengthMg ?? 0,
    })),
    purposes: medication.purposes,
    dosageForm: medication.dosageForm,
    Frequency: medication.frequency ?? schedule.frequency,
    doseAmount: medication.doseAmount ?? 0,
    warning: medication.warning,
    avoidWithConditions: medication.avoidWithConditions,
    avoidWithIngredients: medication.avoidWithIngredients,
    time: schedule.times[0] ? time12(schedule.times[0]) : "12:00 AM",
    color: schedule.metadata?.color ?? "#6D8D78",
    startDate: schedule.startDate,
    endDate: schedule.endDate ?? schedule.startDate,
    notes: schedule.metadata?.notes ?? "",
    reminderTimes: schedule.metadata?.reminderTimes?.map(time12) ?? schedule.times.map(time12),
    selectedWeekdays: schedule.metadata?.selectedWeekdays ?? schedule.daysOfWeek.map((day) => dayNames.indexOf(day)),
    intervalDays: schedule.intervalDays ?? 1,
  };
}

function expand(schedule: BackendSchedule) {
  const output: Record<string, Medication[]> = {};
  const start = new Date(`${schedule.startDate}T12:00:00`);
  const end = new Date(`${schedule.endDate ?? schedule.startDate}T12:00:00`);
  const frequency = schedule.frequency;
  const selectedDays = schedule.metadata?.selectedWeekdays ?? schedule.daysOfWeek.map((day) => dayNames.indexOf(day));
  for (const current = new Date(start); current <= end && Object.keys(output).length < 366; current.setDate(current.getDate() + 1)) {
    const day = current.getDay();
    const include = frequency === "daily" || frequency === "once_daily" || frequency === "as_needed" ||
      (frequency === "weekly" || frequency === "selected_days") && selectedDays.includes(day) ||
      frequency === "every_n_days" && Math.round((current.getTime() - start.getTime()) / 86400000) % (schedule.intervalDays ?? 1) === 0 ||
      frequency === "monthly" && current.getDate() === start.getDate() ||
      frequency === "once" && current.toDateString() === start.toDateString();
    if (!include) continue;
    const key = dateKey(current);
    output[key] = (schedule.times.length ? schedule.times : ["00:00"]).map((time) => {
      const taken = schedule.doseLogs.find((log) => log.localDate === key && log.time === time);
      return {
        ...mapMedication(schedule),
        id: `${schedule.id}|${key}|${encodeURIComponent(time)}`,
        time: time12(time),
        scheduledDate: key,
        status: taken ? "taken" : "upcoming",
        takenAt: taken?.takenAt ?? undefined,
        dosage: `${schedule.medication.doseAmount ?? 0} ${schedule.medication.dosageForm}`,
        color: schedule.metadata?.color ?? "#6D8D78",
      };
    });
  }
  return output;
}

export function MedicationProvider({ children }: { children: ReactNode }) {
  const { session, authenticatedFetch } = useAuth();
  const [schedules, setSchedules] = useState<BackendSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(async () => {
    if (!session) { setSchedules([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const response = await authenticatedFetch("/schedules");
      setSchedules(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load medication schedules.");
    } finally { setLoading(false); }
  }, [authenticatedFetch, session]);
  // This effect synchronizes the provider with the authenticated session.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void retry(); }, [retry]);

  const medicationsByDate = useMemo(() => schedules.reduce<Record<string, Medication[]>>((all, schedule) => {
    Object.entries(expand(schedule)).forEach(([key, values]) => { all[key] = [...(all[key] ?? []), ...values]; });
    return all;
  }, {}), [schedules]);

  const formPayload = (date: Date, medication: MedicationFormValues) => ({
    medicationId: medication.id,
    times: (medication.reminderTimes.length ? medication.reminderTimes : [medication.time]).map(time24),
    startDate: medication.startDate || dateKey(date),
    endDate: medication.endDate || medication.startDate || dateKey(date),
    frequency: frequencyMap[medication.Frequency] ?? "daily",
    daysOfWeek: medication.selectedWeekdays.map((day) => dayNames[day]),
    intervalDays: medication.intervalDays,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    metadata: { color: medication.color, notes: medication.notes, reminderTimes: medication.reminderTimes, selectedWeekdays: medication.selectedWeekdays },
  });
  const addMedication = useCallback(async (date: Date, medication: MedicationFormValues) => {
    const response = await authenticatedFetch("/schedules", { method: "POST", body: JSON.stringify({ ...formPayload(date, medication), medication: { ...medication } }) });
    const created = await response.json();
    setSchedules((current) => [...current, created]);
  }, [authenticatedFetch]);
  const updateMedication = useCallback(async (id: string, medication: MedicationFormValues) => {
    const scheduleId = id.split("|")[0];
    const response = await authenticatedFetch(`/schedules/${scheduleId}`, {
      method: "PATCH",
      body: JSON.stringify({ ...formPayload(new Date(), medication), medication: { ...medication } }),
    });
    const updated = await response.json();
    setSchedules((current) => current.map((schedule) => schedule.id === scheduleId ? updated : schedule));
  }, [authenticatedFetch]);
  const deleteMedication = useCallback(async (id: string) => {
    const scheduleId = id.split("|")[0];
    await authenticatedFetch(`/schedules/${scheduleId}`, { method: "DELETE" });
    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId));
  }, [authenticatedFetch]);
  const cycleMedicationStatus = useCallback(async (id: string) => {
    const [scheduleId, localDate, encodedTime] = id.split("|");
    const time = encodedTime ? decodeURIComponent(encodedTime) : "";
    if (!scheduleId || !localDate || !time) throw new Error("Dose is no longer available.");
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule) throw new Error("Schedule is no longer available.");
    const taken = schedule.doseLogs.some((log) => log.localDate === localDate && log.time === time);
    await authenticatedFetch(`/schedules/${scheduleId}/doses/${localDate}/${time}`, { method: taken ? "DELETE" : "PUT" });
    await retry();
  }, [authenticatedFetch, retry, schedules]);

  const value = useMemo(() => ({ medicationsByDate, cycleMedicationStatus, addMedication, updateMedication, deleteMedication, loading, error, retry }), [medicationsByDate, cycleMedicationStatus, addMedication, updateMedication, deleteMedication, loading, error, retry]);
  return <MedicationContext.Provider value={value}>{children}</MedicationContext.Provider>;
}

export function useMedications() {
  const context = useContext(MedicationContext);
  if (!context) throw new Error("useMedications must be used inside MedicationProvider");
  return context;
}
