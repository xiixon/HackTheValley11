export type MedicationStatus = 'upcoming' | 'taken';

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: MedicationStatus;
  color: string;
};
