/** Reviewed Canadian formulation references, not approval of an imported brand or permission for vending sales. */
export type CanadianClassification = {
  status: 'non_prescription' | 'prescription' | 'natural_health_product' | 'unverified';
  label: string;
  scope: 'formulation_reference' | 'product_category' | 'unverified';
  checkedAt: string;
  sourceUrl?: string;
  referenceDin?: string;
  note: string;
};
export type ClassificationMedicine = {
  genericName: string;
  brandName?: string;
  dosageForm: string;
  ingredients: readonly { name: string; strengthMg?: number; strength?: number }[];
};
type Reference = {
  id: string; ingredient: string; strengthMg: number; dosageForm: 'tablet' | 'capsule';
  status: 'non_prescription' | 'prescription'; sourceUrl: string; referenceDin?: string;
  productId?: string; priceCents?: number;
};
const ASA = 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/nonprescription-drugs-labelling-standards/acetylsalicylic-acid-labelling-standard.html';
const ACETAMINOPHEN = 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/revised-guidance-document-acetaminophen-labelling-standard.html';
export const canadianFormulations: readonly Reference[] = [
  { id: 'ca-acetaminophen-325', ingredient: 'acetaminophen', strengthMg: 325, dosageForm: 'tablet', status: 'non_prescription', sourceUrl: ACETAMINOPHEN, productId: 'acetaminophen-325', priceCents: 599 },
  { id: 'ca-acetaminophen-500', ingredient: 'acetaminophen', strengthMg: 500, dosageForm: 'tablet', status: 'non_prescription', sourceUrl: 'https://health-products.canada.ca/dpd-bdpp/info?code=8387&lang=eng', referenceDin: '00723908', productId: 'acetaminophen-500', priceCents: 649 },
  { id: 'ca-asa-325', ingredient: 'acetylsalicylic acid', strengthMg: 325, dosageForm: 'tablet', status: 'non_prescription', sourceUrl: ASA, productId: 'asa-325', priceCents: 599 },
  { id: 'ca-asa-500', ingredient: 'acetylsalicylic acid', strengthMg: 500, dosageForm: 'tablet', status: 'non_prescription', sourceUrl: ASA, productId: 'asa-500', priceCents: 649 },
  { id: 'ca-ibuprofen-200', ingredient: 'ibuprofen', strengthMg: 200, dosageForm: 'tablet', status: 'non_prescription', sourceUrl: 'https://health-products.canada.ca/dpd-bdpp/info?code=13625&lang=eng', referenceDin: '01933558', productId: 'ibuprofen-200', priceCents: 699 },
  { id: 'ca-cetirizine-hcl-10', ingredient: 'cetirizine hydrochloride', strengthMg: 10, dosageForm: 'tablet', status: 'non_prescription', sourceUrl: 'https://health-products.canada.ca/noc-ac/nocInfo?no=2746', referenceDin: '02231603', productId: 'cetirizine-hcl-10', priceCents: 899 },
  { id: 'ca-loratadine-10', ingredient: 'loratadine', strengthMg: 10, dosageForm: 'tablet', status: 'non_prescription', sourceUrl: 'https://health-products.canada.ca/dpd-bdpp/info?code=10533&lang=eng', referenceDin: '00782696', productId: 'loratadine-10', priceCents: 899 },
  { id: 'ca-amlodipine-5', ingredient: 'amlodipine', strengthMg: 5, dosageForm: 'tablet', status: 'prescription', sourceUrl: 'https://health-products.canada.ca/dpd-bdpp/info?code=81214&lang=eng', referenceDin: '02326809' },
  { id: 'ca-atorvastatin-10', ingredient: 'atorvastatin', strengthMg: 10, dosageForm: 'tablet', status: 'prescription', sourceUrl: 'https://produits-sante.canada.ca/dpd-bdpp/search-fast-recherche-rapide?lang=eng&no=0133055001', referenceDin: '02230711' },
  { id: 'ca-amoxicillin-500', ingredient: 'amoxicillin', strengthMg: 500, dosageForm: 'capsule', status: 'prescription', sourceUrl: 'https://recalls-rappels.canada.ca/en/alert-recall/unauthorized-prescription-antibiotic-drugs-seized-gigi-s-market-ottawa-may-pose' },
];
export function normalizeIngredient(name: string) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  return ({ aspirin: 'acetylsalicylic acid', asa: 'acetylsalicylic acid', paracetamol: 'acetaminophen', apap: 'acetaminophen', 'cetirizine hcl': 'cetirizine hydrochloride' } as Record<string, string>)[normalized] ?? normalized;
}
export function matchingCanadianFormulation(medicine: ClassificationMedicine) {
  if (medicine.ingredients.length !== 1 || /\b(?:extended|delayed|modified|sustained)[ -]release\b|\b(?:sr|xr|er|cr|mr)\b/i.test(medicine.brandName ?? '')) return undefined;
  const ingredient = medicine.ingredients[0]!;
  const name = normalizeIngredient(ingredient.name);
  // A brand/generic name alone must not hide a second or conflicting ingredient.
  if (normalizeIngredient(medicine.genericName) !== name) return undefined;
  return canadianFormulations.find(rule => rule.ingredient === name && rule.strengthMg === (ingredient.strengthMg ?? ingredient.strength) && rule.dosageForm === medicine.dosageForm);
}
export function classifyCanadianMedicine(medicine: ClassificationMedicine): CanadianClassification {
  const rule = matchingCanadianFormulation(medicine);
  if (rule) return {
    status: rule.status, label: rule.status === 'non_prescription' ? 'Non-prescription (Canada)' : 'Prescription (Canada)',
    scope: 'formulation_reference', checkedAt: '2026-10-18', sourceUrl: rule.sourceUrl,
    ...(rule.referenceDin ? { referenceDin: rule.referenceDin } : {}),
    note: 'Canadian ingredient, strength and form reference; this does not establish Canadian approval of this brand.',
  };
  return { status: 'unverified', label: 'Canadian status not verified', scope: 'unverified', checkedAt: '2026-10-18', note: 'This exact ingredient, strength and form has not been verified. Ask a licensed pharmacist.' };
}
export function naturalHealthCategory(): CanadianClassification {
  return { status: 'natural_health_product', label: 'Natural health product', scope: 'product_category', checkedAt: '2026-10-18',
    sourceUrl: 'https://www.canada.ca/en/health-canada/services/drugs-health-products/natural-non-prescription/regulation.html',
    note: 'Vitamins and minerals use the natural health product framework. An actual product needs its own licence/NPN.' };
}
