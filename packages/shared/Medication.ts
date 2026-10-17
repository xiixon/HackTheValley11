export type Medication = {
    id: string;
    genericName: string; // Official, universal scientific name
    brandName: string; // Commercial name given by pharmaceutical companies
    ingredients: Ingredient[];
    purposes: string[]; // Symptoms that the medication treat
    dosageForm: DosageForm;

    // Instructions & Safety
    Frequency: string; // how frequently users need to take the medication
    doseAmount: number; // eg. number of tablets taken per dose
    warning: string[];
    avoidWithConditions: string[]; // eg. ["high blood pressure", "pregnancy"]
    avoidWithIngredients: string[];
}

export type Ingredient = {
    name: string;
    strength: number; // unit: mg
}

export type DosageForm = "tablet" | "capsule" | "powder" | "liquid" | "cream" | "inhaler"
