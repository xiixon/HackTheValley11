import type { MedicationFormValues } from '../types/medication';

export type DatabaseMedication = {
  id: string;
  genericName: string;
  brandName: string;
  dosageForm: MedicationFormValues['dosageForm'];
  ingredients: { name: string; strengthMg: number }[];
  purposes: string[];
  warning: string[];
  avoidWithConditions: string[];
  avoidWithIngredients: string[];
};

/** Copy catalog facts without treating a catalog record as a personal dose. */
export function catalogFormFields(medicine: DatabaseMedication) {
  return {
    id: medicine.id,
    catalogMedicationId: medicine.id,
    genericName: medicine.genericName,
    brandName: medicine.brandName,
    dosageForm: medicine.dosageForm,
    ingredients: medicine.ingredients.map(({ name, strengthMg }) => ({ name, strength: strengthMg })),
    purposes: medicine.purposes,
    warning: medicine.warning,
    avoidWithConditions: medicine.avoidWithConditions,
    avoidWithIngredients: medicine.avoidWithIngredients,
  };
}
