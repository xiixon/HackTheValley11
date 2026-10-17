import type {
  DosageForm,
  Ingredient,
  Medication as SharedMedication,
} from '../../../../shared/src/types/Medication';

export type MedicationStatus = 'upcoming' | 'taken';

export type Medication = SharedMedication & {
  dosage: string;
  time: string;
  status: MedicationStatus;
  color: string;
};

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
};

export type { DosageForm, Ingredient };
