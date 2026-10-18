import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNow } from '../hooks/useNow';
import { dateKey, expand, frequencyMap, time24, type BackendSchedule } from '../lib/schedulePresentation';
import { useMedicationNotifications } from '../notifications/useMedicationNotifications';
import { useAuth } from "../auth/AuthContext";
import { Medication, MedicationFormValues } from "../types/medication";


type MedicationContextValue = {
  medicationsByDate: Record<string, Medication[]>;
  now: Date;
  pendingIds: ReadonlySet<string>;
  cycleMedicationStatus: (id: string) => Promise<void>;
  addMedication: (date: Date, medication: MedicationFormValues) => Promise<void>;
  updateMedication: (id: string, medication: MedicationFormValues) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
};

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const MedicationContext = createContext<MedicationContextValue | undefined>(undefined);

export function MedicationProvider({ children }: { children: ReactNode }) {
  const { session, authenticatedFetch } = useAuth();
  const now = useNow();
  const today = dateKey(now);
  const requestVersion = useRef(0);
  const locks = useRef(new Set<string>());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [schedules, setSchedules] = useState<BackendSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useMedicationNotifications(schedules);

  const retry = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!session) { setSchedules([]); setLoading(false); setError(null); return; }
    setLoading(true); setError(null);
    try {
      const response = await authenticatedFetch("/schedules");
      const data = await response.json();
      if (version === requestVersion.current) setSchedules(data);
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : "Unable to load medication schedules.");
    } finally { if (version === requestVersion.current) setLoading(false); }
  }, [authenticatedFetch, session]);
  // This effect synchronizes the provider with the authenticated session.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void retry(); }, [retry]);

  const medicationsByDate = useMemo(() => {
    const all = schedules.reduce<Record<string, Medication[]>>((result, schedule) => {
      Object.entries(expand(schedule, new Date(`${today}T12:00:00`))).forEach(([key, values]) => { result[key] = [...(result[key] ?? []), ...values]; });
      return result;
    }, {});
    Object.values(all).forEach(medications => medications.sort((a, b) => time24(a.time).localeCompare(time24(b.time))));
    return all;
  }, [schedules, today]);

  const formPayload = (date: Date, medication: MedicationFormValues) => ({
    medicationId: medication.id,
    times: [...new Set((medication.reminderTimes.length ? medication.reminderTimes : [medication.time]).map(time24))].sort(),
    startDate: medication.startDate || dateKey(date),
    endDate: medication.endDate || null,
    frequency: frequencyMap[medication.Frequency] ?? "daily",
    daysOfWeek: ["Weekly", "Selected days"].includes(medication.Frequency) ? medication.selectedWeekdays.map((day) => dayNames[day]) : [],
    intervalDays: medication.intervalDays,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    metadata: {
      doseAmount: medication.doseAmount,
      catalogMedicationId: medication.catalogMedicationId,
      color: medication.color,
      notes: medication.notes,
      reminderTimes: medication.reminderTimes,
      selectedWeekdays: medication.selectedWeekdays,
      notificationOffsets: medication.notificationOffsets,
      notificationSound: medication.notificationSound,
    },
  });
  const addMedication = useCallback(async (date: Date, medication: MedicationFormValues) => {
    const response = await authenticatedFetch("/schedules", { method: "POST", body: JSON.stringify({ ...formPayload(date, medication), ...(medication.catalogMedicationId ? {} : { medication: { ...medication } }) }) });
    const created = await response.json();
    requestVersion.current++;
    setLoading(false);
    setSchedules((current) => [...current, created]);
  }, [authenticatedFetch]);
  const updateMedication = useCallback(async (id: string, medication: MedicationFormValues) => {
    const scheduleId = id.split("|")[0];
    const response = await authenticatedFetch(`/schedules/${scheduleId}`, {
      method: "PATCH",
      body: JSON.stringify({ ...formPayload(new Date(), medication), ...(medication.catalogMedicationId ? {} : { medication: { ...medication } }) }),
    });
    const updated = await response.json();
    requestVersion.current++;
    setLoading(false);
    setSchedules((current) => current.map((schedule) => schedule.id === scheduleId ? updated : schedule));
  }, [authenticatedFetch]);
  const runAction = useCallback(async (id: string, task: () => Promise<void>) => {
    if (locks.current.has(id)) return;
    locks.current.add(id);
    setPendingIds(new Set(locks.current));
    setError(null);
    try { await task(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update your medication. Please try again."); }
    finally { locks.current.delete(id); setPendingIds(new Set(locks.current)); }
  }, []);
  const deleteMedication = useCallback(async (id: string) => runAction(id, async () => {
    const scheduleId = id.split("|")[0];
    await authenticatedFetch(`/schedules/${scheduleId}`, { method: "DELETE" });
    requestVersion.current++;
    setLoading(false);
    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId));
  }), [authenticatedFetch, runAction]);
  const cycleMedicationStatus = useCallback(async (id: string) => runAction(id, async () => {
    const [scheduleId, localDate, encodedTime] = id.split("|");
    const time = encodedTime ? decodeURIComponent(encodedTime) : "";
    if (!scheduleId || !localDate || !time) throw new Error("Dose is no longer available.");
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule) throw new Error("Schedule is no longer available.");
    const taken = schedule.doseLogs.some((log) => log.localDate === localDate && log.time === time && !!log.takenAt);
    const response = await authenticatedFetch(`/schedules/${scheduleId}/doses/${localDate}/${time}`, { method: taken ? "DELETE" : "PUT" });
    const log = taken ? null : await response.json();
    requestVersion.current++;
    setLoading(false);
    setSchedules(current => current.map(item => item.id !== scheduleId ? item : { ...item,
      doseLogs: [...item.doseLogs.filter(existing => existing.localDate !== localDate || existing.time !== time), ...(log ? [log] : [])],
    }));
  }), [authenticatedFetch, runAction, schedules]);

  const value = useMemo(() => ({ medicationsByDate, now, pendingIds, cycleMedicationStatus, addMedication, updateMedication, deleteMedication, loading, error, retry }), [medicationsByDate, now, pendingIds, cycleMedicationStatus, addMedication, updateMedication, deleteMedication, loading, error, retry]);
  return <MedicationContext.Provider value={value}>{children}</MedicationContext.Provider>;
}

export function useMedications() {
  const context = useContext(MedicationContext);
  if (!context) throw new Error("useMedications must be used inside MedicationProvider");
  return context;
}
