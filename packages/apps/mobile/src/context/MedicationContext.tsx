import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { todaysMedications } from "../data/medications";
import { Medication } from "../types/medication";

type MedicationContextValue = {
  medicationsByDate: Record<string, Medication[]>;
  toggleMedicationTaken: (id: string) => void;
};

const MedicationContext = createContext<MedicationContextValue | undefined>(
  undefined,
);

function getTodayKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

export function MedicationProvider({ children }: { children: ReactNode }) {
  const [medicationsByDate, setMedicationsByDate] = useState<
    Record<string, Medication[]>
  >({
    [getTodayKey()]: todaysMedications,
  });

  const toggleMedicationTaken = (id: string) => {
    setMedicationsByDate((current) => {
      const next = { ...current };

      for (const dateKey of Object.keys(next)) {
        const medications = next[dateKey];
        if (!medications.some((medication) => medication.id === id)) continue;

        next[dateKey] = medications.map((medication) =>
          medication.id === id
            ? {
                ...medication,
                status: medication.status === "taken" ? "upcoming" : "taken",
              }
            : medication,
        );
        break;
      }

      return next;
    });
  };

  const value = useMemo(
    () => ({ medicationsByDate, toggleMedicationTaken }),
    [medicationsByDate],
  );

  return (
    <MedicationContext.Provider value={value}>
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedications() {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error("useMedications must be used inside MedicationProvider");
  }

  return context;
}
