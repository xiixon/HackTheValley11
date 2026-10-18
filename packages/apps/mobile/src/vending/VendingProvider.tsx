import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useMedications } from '../context/MedicationContext';
import { apiUrl } from '../lib/api';
import { dateKey } from '../lib/schedulePresentation';
import type { VendingDose, VendingPass } from '../../../../shared/src/types/Vending';

type VendingState = { pass: VendingPass | null; syncing: boolean; error: string; retry: () => void };
const Context = createContext<VendingState | null>(null);
export function VendingProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const { medicationsByDate, now, loading, error: medicationError, retry: reloadMedications } = useMedications();
  const [pass, setPass] = useState<VendingPass | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const today = dateKey(now);
  const schedule = useMemo<VendingDose[]>(() => Object.entries(medicationsByDate).filter(([date]) => date >= today)
    .flatMap(([date, medications]) => medications.map((medication) => ({ id: medication.id, date, time: /as[_ ]needed/i.test(medication.Frequency) ? "As needed" : medication.time,
      name: medication.genericName, dosage: medication.dosage, status: medication.status }))), [medicationsByDate, today]);
  useEffect(() => {
    if (!session || loading || medicationError) return;
    const controller = new AbortController();
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    const timer = setTimeout(async () => {
      setSyncing(true);
      setError('');
      timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(`${apiUrl}/vending/pass`, { method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ schedule, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Toronto' }),
          signal: controller.signal });
        if (!response.ok) throw new Error('Could not sync your vending pass. Please try again.');
        const result = await response.json() as VendingPass;
        if (active) setPass(result);
      } catch {
        if (active) setError('Your schedule has not synced. Check your connection, then try again.');
      } finally {
        clearTimeout(timeout);
        if (active) setSyncing(false);
      }
    }, 400);
    return () => { active = false; clearTimeout(timer); clearTimeout(timeout); controller.abort(); };
  }, [session, schedule, attempt, loading, medicationError]);
  return <Context.Provider value={{ pass, syncing: loading || (!medicationError && syncing), error: medicationError || error, retry: () => { if (medicationError) void reloadMedications(); else setAttempt((current) => current + 1); } }}>{children}</Context.Provider>;
}
export function useVending() {
  const state = useContext(Context);
  if (!state) throw new Error('useVending needs VendingProvider');
  return state;
}
