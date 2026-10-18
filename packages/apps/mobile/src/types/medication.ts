import type {
  DosageForm,
  Ingredient,
  Medication as SharedMedication,
} from '../../../../shared/src/types/Medication';

export type MedicationStatus = 'upcoming' | 'taken';

export type Medication = SharedMedication & {
  dosage: string;
  time: string;
  scheduledDate?: string;
  status: MedicationStatus;
  color: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  reminderTimes?: string[];
  selectedWeekdays?: number[];
  intervalDays?: number;
};

export type MedicationDisplayStatus = MedicationStatus | 'missed';

export function getMedicationDisplayStatus(
  medication: Medication,
  now = new Date(),
): MedicationDisplayStatus {
  if (medication.status === 'taken' || !medication.scheduledDate) {
    return medication.status;
  }

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (medication.scheduledDate < todayKey) return 'missed';
  if (medication.scheduledDate > todayKey) return 'upcoming';

  const timeMatch = medication.time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!timeMatch) return 'upcoming';

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] ?? 0);
  const meridiem = timeMatch[3].toUpperCase();
  if (hour === 12) hour = 0;
  if (meridiem === 'PM') hour += 12;

  const scheduledTime = new Date(now);
  scheduledTime.setHours(hour, minute, 0, 0);
  return now >= scheduledTime ? 'missed' : 'upcoming';
}

export type MedicationFormValues = Pick<
  SharedMedication,
  | 'id'
  | 'genericName'
  | 'brandName'
  | 'ingredients'
  | 'purposes'
  | 'dosageForm'
  | 'Frequency'
  | 'doseAmount'
  | 'warning'
  | 'avoidWithConditions'
  | 'avoidWithIngredients'
> & {
  time: string;
  color: string;
  startDate: string;
  endDate: string;
  notes: string;
  reminderTimes: string[];
  selectedWeekdays: number[];
  intervalDays: number;
};

export type { DosageForm, Ingredient };
