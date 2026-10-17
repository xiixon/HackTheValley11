import type { Medication } from '../types/medication';

type DosageRule = {
  min: number;
  max: number;
  unit: 'mg' | 'mcg' | 'IU' | 'g';
};

export type MedicationCatalogEntry = Medication & {
  /** A concise display name used by the medication picker. */
  name: string;
  /** A human-readable dose description, separate from doseAmount. */
  dosage: string;
  /** Lowercase alias used by integrations that do not use the shared model's Frequency key. */
  frequency: string;
  sideEffects: string[];
  contraindications: string[];
  dosageRule: DosageRule;
  allowedFrequencies: string[];
  interactionGroups: string[];
};

export type MedicationValidationResult = {
  valid: boolean;
  errors: string[];
};

const colors = {
  accent: '#FF95A5',
  blue: '#76C0EC',
  indigo: '#425B9A',
  cream: '#FFF6DC',
} as const;

const onceDaily = ['Once daily'];

/**
 * This is a product-safety validation layer, not a substitute for a clinician
 * or pharmacist. Dosage rules are intentionally conservative catalog bounds.
 */
const medicationCatalogEntries: MedicationCatalogEntry[] = [
  {
    id: 'vitamin-d',
    name: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    brandName: 'Vitamin D3',
    ingredients: [{ name: 'Cholecalciferol', strength: 1000 }],
    purposes: ['Vitamin D supplementation'],
    dosageForm: 'capsule',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '1000 IU · 1 capsule',
    dosageRule: { min: 400, max: 4000, unit: 'IU' },
    allowedFrequencies: onceDaily,
    warning: ['Confirm the strength with a healthcare professional if using other vitamin D products.'],
    sideEffects: ['Nausea', 'Constipation'],
    avoidWithConditions: ['Hypercalcemia'],
    contraindications: ['Known vitamin D toxicity'],
    avoidWithIngredients: [],
    interactionGroups: ['vitamin-d'],
    time: '8:00 AM',
    status: 'taken',
    color: colors.accent,
  },
  {
    id: 'lisinopril',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    brandName: 'Lisinopril',
    ingredients: [{ name: 'Lisinopril', strength: 10 }],
    purposes: ['Blood pressure management'],
    dosageForm: 'tablet',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '10 mg · 1 tablet',
    dosageRule: { min: 2.5, max: 80, unit: 'mg' },
    allowedFrequencies: onceDaily,
    warning: ['Seek professional advice if dizziness, swelling, or fainting occurs.'],
    sideEffects: ['Dizziness', 'Dry cough'],
    avoidWithConditions: ['History of angioedema', 'Pregnancy'],
    contraindications: ['Previous ACE-inhibitor angioedema'],
    avoidWithIngredients: ['Potassium supplements'],
    interactionGroups: ['ace-inhibitor', 'potassium-raising'],
    time: '12:30 PM',
    status: 'upcoming',
    color: colors.blue,
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    genericName: 'Magnesium',
    brandName: 'Magnesium supplement',
    ingredients: [{ name: 'Magnesium', strength: 200 }],
    purposes: ['Supplementation'],
    dosageForm: 'capsule',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '200 mg · 1 capsule',
    dosageRule: { min: 50, max: 350, unit: 'mg' },
    allowedFrequencies: onceDaily,
    warning: ['Separate from medicines whose absorption can be affected by minerals.'],
    sideEffects: ['Diarrhea', 'Abdominal cramping'],
    avoidWithConditions: ['Severe kidney disease'],
    contraindications: ['Known magnesium toxicity'],
    avoidWithIngredients: ['Doxycycline', 'Levothyroxine'],
    interactionGroups: ['magnesium'],
    time: '8:00 PM',
    status: 'upcoming',
    color: colors.indigo,
  },
  {
    id: 'acetaminophen',
    name: 'Acetaminophen',
    genericName: 'Acetaminophen',
    brandName: 'Tylenol',
    ingredients: [{ name: 'Acetaminophen', strength: 500 }],
    purposes: ['Pain relief', 'Fever reduction'],
    dosageForm: 'tablet',
    Frequency: 'Every 6 hours as needed',
    frequency: 'Every 6 hours as needed',
    doseAmount: 1,
    dosage: '500 mg · 1 tablet',
    dosageRule: { min: 325, max: 1000, unit: 'mg' },
    allowedFrequencies: ['Every 4 hours as needed', 'Every 6 hours as needed', 'Every 8 hours as needed'],
    warning: ['Do not combine with other products containing acetaminophen.'],
    sideEffects: ['Nausea', 'Rash'],
    avoidWithConditions: ['Liver disease'],
    contraindications: ['Severe liver impairment'],
    avoidWithIngredients: ['Alcohol'],
    interactionGroups: ['acetaminophen', 'liver-risk'],
    time: 'As needed',
    status: 'upcoming',
    color: colors.accent,
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    ingredients: [{ name: 'Ibuprofen', strength: 200 }],
    purposes: ['Pain relief', 'Inflammation reduction'],
    dosageForm: 'tablet',
    Frequency: 'Every 6 hours as needed',
    frequency: 'Every 6 hours as needed',
    doseAmount: 1,
    dosage: '200 mg · 1 tablet',
    dosageRule: { min: 200, max: 800, unit: 'mg' },
    allowedFrequencies: ['Every 6 hours as needed', 'Every 8 hours as needed'],
    warning: ['Take only as directed and discuss prolonged use with a clinician.'],
    sideEffects: ['Stomach upset', 'Heartburn'],
    avoidWithConditions: ['Stomach ulcer', 'Kidney disease', 'Uncontrolled hypertension'],
    contraindications: ['Previous serious NSAID reaction'],
    avoidWithIngredients: ['Warfarin', 'Aspirin'],
    interactionGroups: ['nsaid', 'bleeding-risk', 'kidney-risk'],
    time: 'As needed',
    status: 'upcoming',
    color: colors.blue,
  },
  {
    id: 'metformin',
    name: 'Metformin',
    genericName: 'Metformin',
    brandName: 'Glucophage',
    ingredients: [{ name: 'Metformin', strength: 500 }],
    purposes: ['Type 2 diabetes management'],
    dosageForm: 'tablet',
    Frequency: 'Twice daily',
    frequency: 'Twice daily',
    doseAmount: 1,
    dosage: '500 mg · 1 tablet',
    dosageRule: { min: 500, max: 1000, unit: 'mg' },
    allowedFrequencies: ['Once daily', 'Twice daily'],
    warning: ['Take with meals if directed to reduce stomach upset.'],
    sideEffects: ['Nausea', 'Diarrhea'],
    avoidWithConditions: ['Severe kidney disease', 'Severe liver disease'],
    contraindications: ['Severe renal impairment'],
    avoidWithIngredients: ['Alcohol'],
    interactionGroups: ['metformin', 'kidney-risk'],
    time: 'With breakfast and dinner',
    status: 'upcoming',
    color: colors.indigo,
  },
  {
    id: 'amlodipine',
    name: 'Amlodipine',
    genericName: 'Amlodipine',
    brandName: 'Norvasc',
    ingredients: [{ name: 'Amlodipine', strength: 5 }],
    purposes: ['Blood pressure management'],
    dosageForm: 'tablet',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '5 mg · 1 tablet',
    dosageRule: { min: 2.5, max: 10, unit: 'mg' },
    allowedFrequencies: onceDaily,
    warning: ['Report severe swelling, fainting, or chest pain promptly.'],
    sideEffects: ['Ankle swelling', 'Dizziness'],
    avoidWithConditions: ['Severe low blood pressure'],
    contraindications: ['Known serious amlodipine allergy'],
    avoidWithIngredients: [],
    interactionGroups: ['calcium-channel-blocker'],
    time: '9:00 AM',
    status: 'upcoming',
    color: colors.blue,
  },
  {
    id: 'levothyroxine',
    name: 'Levothyroxine',
    genericName: 'Levothyroxine',
    brandName: 'Synthroid',
    ingredients: [{ name: 'Levothyroxine', strength: 50 }],
    purposes: ['Thyroid hormone replacement'],
    dosageForm: 'tablet',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '50 mcg · 1 tablet',
    dosageRule: { min: 12.5, max: 300, unit: 'mcg' },
    allowedFrequencies: onceDaily,
    warning: ['Take consistently as directed, usually on an empty stomach.'],
    sideEffects: ['Palpitations', 'Insomnia'],
    avoidWithConditions: ['Untreated adrenal insufficiency'],
    contraindications: ['Untreated thyrotoxicosis'],
    avoidWithIngredients: ['Calcium', 'Iron', 'Magnesium'],
    interactionGroups: ['levothyroxine', 'absorption-sensitive'],
    time: '7:00 AM',
    status: 'upcoming',
    color: colors.accent,
  },
  {
    id: 'amoxicillin',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    ingredients: [{ name: 'Amoxicillin', strength: 500 }],
    purposes: ['Bacterial infection treatment'],
    dosageForm: 'capsule',
    Frequency: 'Three times daily',
    frequency: 'Three times daily',
    doseAmount: 1,
    dosage: '500 mg · 1 capsule',
    dosageRule: { min: 250, max: 1000, unit: 'mg' },
    allowedFrequencies: ['Twice daily', 'Three times daily'],
    warning: ['Complete the prescribed course unless a clinician tells you to stop.'],
    sideEffects: ['Diarrhea', 'Nausea', 'Rash'],
    avoidWithConditions: ['Kidney disease'],
    contraindications: ['Serious penicillin allergy'],
    avoidWithIngredients: ['Penicillin'],
    interactionGroups: ['penicillin', 'antibiotic'],
    time: '8:00 AM',
    status: 'upcoming',
    color: colors.indigo,
  },
  {
    id: 'sertraline',
    name: 'Sertraline',
    genericName: 'Sertraline',
    brandName: 'Zoloft',
    ingredients: [{ name: 'Sertraline', strength: 50 }],
    purposes: ['Depression management', 'Anxiety management'],
    dosageForm: 'tablet',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '50 mg · 1 tablet',
    dosageRule: { min: 25, max: 200, unit: 'mg' },
    allowedFrequencies: onceDaily,
    warning: ['Do not stop suddenly without prescriber guidance.'],
    sideEffects: ['Nausea', 'Headache', 'Sleep changes'],
    avoidWithConditions: ['Bipolar disorder without mood stabilizer'],
    contraindications: ['Current MAOI use'],
    avoidWithIngredients: ['MAOI medicines', 'Tramadol'],
    interactionGroups: ['ssri', 'serotonin-risk'],
    time: '9:00 AM',
    status: 'upcoming',
    color: colors.accent,
  },
  {
    id: 'warfarin',
    name: 'Warfarin',
    genericName: 'Warfarin',
    brandName: 'Coumadin',
    ingredients: [{ name: 'Warfarin', strength: 5 }],
    purposes: ['Blood clot prevention'],
    dosageForm: 'tablet',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '5 mg · 1 tablet',
    dosageRule: { min: 0.5, max: 10, unit: 'mg' },
    allowedFrequencies: onceDaily,
    warning: ['Requires monitoring and consistent communication with the care team.'],
    sideEffects: ['Bruising', 'Nosebleeds'],
    avoidWithConditions: ['Active bleeding', 'Severe liver disease'],
    contraindications: ['Pregnancy for most indications'],
    avoidWithIngredients: ['Ibuprofen', 'Aspirin'],
    interactionGroups: ['anticoagulant', 'bleeding-risk'],
    time: '6:00 PM',
    status: 'upcoming',
    color: colors.indigo,
  },
  {
    id: 'albuterol',
    name: 'Albuterol',
    genericName: 'Albuterol',
    brandName: 'Ventolin',
    ingredients: [{ name: 'Albuterol', strength: 90 }],
    purposes: ['Bronchospasm relief'],
    dosageForm: 'inhaler',
    Frequency: 'Every 4 to 6 hours as needed',
    frequency: 'Every 4 to 6 hours as needed',
    doseAmount: 1,
    dosage: '90 mcg · 1 inhalation',
    dosageRule: { min: 90, max: 360, unit: 'mcg' },
    allowedFrequencies: ['Every 4 to 6 hours as needed'],
    warning: ['Seek urgent care for severe or rapidly worsening breathing difficulty.'],
    sideEffects: ['Tremor', 'Fast heartbeat'],
    avoidWithConditions: ['Heart rhythm disorders'],
    contraindications: ['Known serious albuterol allergy'],
    avoidWithIngredients: [],
    interactionGroups: ['beta-agonist'],
    time: 'As needed',
    status: 'upcoming',
    color: colors.blue,
  },
  {
    id: 'omeprazole',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    brandName: 'Prilosec',
    ingredients: [{ name: 'Omeprazole', strength: 20 }],
    purposes: ['Heartburn relief'],
    dosageForm: 'capsule',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '20 mg · 1 capsule',
    dosageRule: { min: 10, max: 40, unit: 'mg' },
    allowedFrequencies: onceDaily,
    warning: ['Discuss persistent symptoms or long-term use with a clinician.'],
    sideEffects: ['Headache', 'Abdominal pain'],
    avoidWithConditions: ['Low magnesium history'],
    contraindications: ['Known serious PPI allergy'],
    avoidWithIngredients: [],
    interactionGroups: ['proton-pump-inhibitor'],
    time: '7:30 AM',
    status: 'upcoming',
    color: colors.cream,
  },
  {
    id: 'doxycycline',
    name: 'Doxycycline',
    genericName: 'Doxycycline',
    brandName: 'Vibramycin',
    ingredients: [{ name: 'Doxycycline', strength: 100 }],
    purposes: ['Bacterial infection treatment'],
    dosageForm: 'capsule',
    Frequency: 'Twice daily',
    frequency: 'Twice daily',
    doseAmount: 1,
    dosage: '100 mg · 1 capsule',
    dosageRule: { min: 50, max: 200, unit: 'mg' },
    allowedFrequencies: ['Once daily', 'Twice daily'],
    warning: ['Use sun protection and separate from mineral supplements as directed.'],
    sideEffects: ['Sun sensitivity', 'Nausea'],
    avoidWithConditions: ['Pregnancy', 'Children under 8 years'],
    contraindications: ['Tetracycline allergy'],
    avoidWithIngredients: ['Magnesium', 'Calcium', 'Iron'],
    interactionGroups: ['tetracycline', 'antibiotic', 'absorption-sensitive'],
    time: '8:00 AM and 8:00 PM',
    status: 'upcoming',
    color: colors.accent,
  },
  {
    id: 'aspirin',
    name: 'Aspirin',
    genericName: 'Aspirin',
    brandName: 'Bayer Aspirin',
    ingredients: [{ name: 'Aspirin', strength: 81 }],
    purposes: ['Cardiovascular risk reduction when prescribed'],
    dosageForm: 'tablet',
    Frequency: 'Once daily',
    frequency: 'Once daily',
    doseAmount: 1,
    dosage: '81 mg · 1 tablet',
    dosageRule: { min: 81, max: 325, unit: 'mg' },
    allowedFrequencies: onceDaily,
    warning: ['Use only when recommended for your individual risk profile.'],
    sideEffects: ['Stomach irritation', 'Bruising'],
    avoidWithConditions: ['Stomach ulcer', 'Bleeding disorder'],
    contraindications: ['Aspirin allergy'],
    avoidWithIngredients: ['Warfarin', 'Ibuprofen'],
    interactionGroups: ['antiplatelet', 'bleeding-risk', 'nsaid'],
    time: '8:00 AM',
    status: 'upcoming',
    color: colors.indigo,
  },
  {
    id: 'hydrocortisone',
    name: 'Hydrocortisone',
    genericName: 'Hydrocortisone',
    brandName: 'Cortizone-10',
    ingredients: [{ name: 'Hydrocortisone', strength: 1 }],
    purposes: ['Minor skin irritation relief'],
    dosageForm: 'cream',
    Frequency: 'Twice daily',
    frequency: 'Twice daily',
    doseAmount: 1,
    dosage: '1% · thin layer',
    dosageRule: { min: 0.5, max: 2.5, unit: 'g' },
    allowedFrequencies: ['Once daily', 'Twice daily'],
    warning: ['Avoid prolonged use or large-area application without medical advice.'],
    sideEffects: ['Skin irritation', 'Skin thinning with prolonged use'],
    avoidWithConditions: ['Untreated skin infection'],
    contraindications: ['Known steroid allergy'],
    avoidWithIngredients: [],
    interactionGroups: ['topical-steroid'],
    time: '8:00 AM and 8:00 PM',
    status: 'upcoming',
    color: colors.blue,
  },
];

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const medicationCatalog: MedicationCatalogEntry[] =
  medicationCatalogEntries.map((medication, index) => {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + Math.floor(index / 3));

    return {
      ...medication,
      scheduledDate: getDateKey(scheduledDate),
    };
  });

const interactionRules: {
  groups: [string, string];
  message: string;
}[] = [
  {
    groups: ['anticoagulant', 'nsaid'],
    message: 'May increase bleeding risk when combined.',
  },
  {
    groups: ['antiplatelet', 'anticoagulant'],
    message: 'May increase bleeding risk when combined.',
  },
  {
    groups: ['ssri', 'serotonin-risk'],
    message: 'May increase serotonin-related adverse effects.',
  },
  {
    groups: ['levothyroxine', 'absorption-sensitive'],
    message: 'May reduce absorption; timing should be reviewed by a pharmacist.',
  },
  {
    groups: ['magnesium', 'tetracycline'],
    message: 'Minerals may reduce antibiotic absorption; timing should be reviewed.',
  },
  {
    groups: ['ace-inhibitor', 'potassium-raising'],
    message: 'May increase potassium levels when combined.',
  },
  {
    groups: ['kidney-risk', 'nsaid'],
    message: 'May increase kidney-related risk when combined.',
  },
];

export function validateMedication(
  medication: MedicationCatalogEntry,
): MedicationValidationResult {
  const errors: string[] = [];
  const ingredientStrength = medication.ingredients[0]?.strength;

  if (!medication.doseAmount || medication.doseAmount <= 0) {
    errors.push('Dose amount must be greater than zero.');
  }

  if (ingredientStrength === undefined || ingredientStrength <= 0) {
    errors.push('Ingredient strength must be greater than zero.');
  } else if (
    ingredientStrength < medication.dosageRule.min ||
    ingredientStrength > medication.dosageRule.max
  ) {
    errors.push(
      `Ingredient strength must be between ${medication.dosageRule.min} and ${medication.dosageRule.max} ${medication.dosageRule.unit}.`,
    );
  }

  if (!medication.allowedFrequencies.includes(medication.Frequency)) {
    errors.push(
      `Frequency "${medication.Frequency}" is not configured for ${medication.name}.`,
    );
  }

  if (medication.frequency !== medication.Frequency) {
    errors.push('Frequency aliases must match.');
  }

  return { valid: errors.length === 0, errors };
}

export function checkMedicationInteractions(
  medications: MedicationCatalogEntry[],
): string[] {
  const interactions: string[] = [];

  for (let firstIndex = 0; firstIndex < medications.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < medications.length;
      secondIndex += 1
    ) {
      const first = medications[firstIndex];
      const second = medications[secondIndex];
      if (!first || !second) continue;

      const rule = interactionRules.find(
        ({ groups }) =>
          groups.every((group) => [
            ...first.interactionGroups,
            ...second.interactionGroups,
          ].includes(group)) &&
          groups.some((group) => first.interactionGroups.includes(group)) &&
          groups.some((group) => second.interactionGroups.includes(group)),
      );

      if (rule) {
        interactions.push(`${first.name} + ${second.name}: ${rule.message}`);
      }
    }
  }

  return interactions;
}

export const medicationValidationResults = medicationCatalog.map((medication) => ({
  id: medication.id,
  result: validateMedication(medication),
}));

export const medicationsByDate: Record<string, Medication[]> =
  medicationCatalog.reduce<Record<string, Medication[]>>((grouped, medication) => {
    const dateKey = medication.scheduledDate;
    if (!dateKey) return grouped;

    grouped[dateKey] = [...(grouped[dateKey] ?? []), medication];
    return grouped;
  }, {});

export const todaysMedications: Medication[] =
  medicationsByDate[getDateKey(new Date())] ?? [];

export const commonMedicationCatalog = medicationCatalog.filter(
  (medication) => medication.status === 'upcoming',
);
