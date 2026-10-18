import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { medicationsByDate as initialMedicationsByDate } from "../data/medications";
import { Medication, MedicationFormValues } from "../types/medication";

type MedicationContextValue = {
  medicationsByDate: Record<string, Medication[]>;
  cycleMedicationStatus: (id: string) => void;
  addMedication: (date: Date, medication: MedicationFormValues) => void;
  updateMedication: (id: string, medication: MedicationFormValues) => void;
  deleteMedication: (id: string) => void;
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

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDatesForFrequency(
  medication: MedicationFormValues,
  fallbackDate: Date,
) {
  const start = medication.startDate ? new Date(`${medication.startDate}T12:00:00`) : fallbackDate;
  const end = medication.endDate ? new Date(`${medication.endDate}T12:00:00`) : start;
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end && dates.length < 366) {
    const include =
      medication.Frequency === "Selected days"
        ? medication.selectedWeekdays.includes(current.getDay())
        : medication.Frequency === "Weekly"
          ? current.getDay() === start.getDay()
          : true;
    if (include) dates.push(new Date(current));

    if (medication.Frequency === "Daily" || medication.Frequency === "Selected days") {
      current.setDate(current.getDate() + 1);
    } else if (medication.Frequency === "Every N days") {
      current.setDate(current.getDate() + Math.max(1, medication.intervalDays));
    } else if (medication.Frequency === "Weekly") {
      current.setDate(current.getDate() + 1);
    } else if (medication.Frequency === "Monthly") {
      current.setMonth(current.getMonth() + 1);
    }
    else break;
  }

  return dates;
}

export function MedicationProvider({ children }: { children: ReactNode }) {
  const [medicationsByDate, setMedicationsByDate] = useState<
    Record<string, Medication[]>
  >(() => ({
    ...initialMedicationsByDate,
    [getTodayKey()]: initialMedicationsByDate[getTodayKey()] ?? [],
  }));

  const cycleMedicationStatus = (id: string) => {
    setMedicationsByDate((current) => {
      const next = { ...current };

      for (const dateKey of Object.keys(next)) {
        const medications = next[dateKey];
        if (!medications.some((medication) => medication.id === id)) continue;

        next[dateKey] = medications.map((medication) =>
          medication.id === id
            ? {
                ...medication,
                status: medication.status === "upcoming" ? "taken" : "upcoming",
                takenAt:
                  medication.status === "upcoming"
                    ? new Date().toISOString()
                    : undefined,
              }
            : medication,
        );
        break;
      }

      return next;
    });
  };

  const addMedication = (date: Date, medication: MedicationFormValues) => {
    const dates = getDatesForFrequency(medication, date);
    setMedicationsByDate((current) => {
      const next = { ...current };
      dates.forEach((scheduledDate) => {
        const dateKey = getDateKey(scheduledDate);
        const times = medication.reminderTimes.length ? medication.reminderTimes : [medication.time];
        next[dateKey] = [
          ...(next[dateKey] ?? []),
          ...times.map((time, timeIndex) => ({
            ...medication,
            id: dates.length > 1 || times.length > 1 ? `${medication.id}-${dateKey}-${timeIndex}` : medication.id,
            time,
            scheduledDate: dateKey,
            status: "upcoming" as const,
            dosage: `${medication.doseAmount} ${medication.dosageForm}`,
          })),
        ];
      });
      return next;
    });
  };

  const updateMedication = (id: string, medication: MedicationFormValues) => {
    setMedicationsByDate((current) => {
      const next = { ...current };

      for (const dateKey of Object.keys(next)) {
        const existing = next[dateKey].find((item) => item.id === id);
        if (!existing) continue;

        next[dateKey] = next[dateKey].map((item) =>
          item.id === id
            ? {
                ...medication,
                scheduledDate: item.scheduledDate ?? dateKey,
                status: item.status,
                takenAt: item.takenAt,
                dosage: `${medication.doseAmount} ${medication.dosageForm}`,
              }
            : item,
        );
        break;
      }

      return next;
    });
  };

  const deleteMedication = (id: string) => {
    setMedicationsByDate((current) => {
      const next: Record<string, Medication[]> = {};
      Object.entries(current).forEach(([dateKey, medications]) => {
        const remaining = medications.filter((medication) => medication.id !== id);
        if (remaining.length > 0) next[dateKey] = remaining;
      });
      return next;
    });
  };

  const value = useMemo(
    () => ({
      medicationsByDate,
      cycleMedicationStatus,
      addMedication,
      updateMedication,
      deleteMedication,
    }),
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
