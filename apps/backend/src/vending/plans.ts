import { canadianFormulations, classifyCanadianMedicine, matchingCanadianFormulation, naturalHealthCategory, type ClassificationMedicine } from '../../../../packages/shared/src/canadianClassification';
import type { VendingDose, VendingPlan, VendingProduct, VendingItem, VendingEligibility, PharmacistReferral } from '../../../../packages/shared/src/types/Vending';

export const catalog: VendingProduct[] = [
  ...canadianFormulations.filter(rule => rule.status === 'non_prescription').map(rule => ({
    id: rule.productId!, name: `${rule.ingredient === 'acetylsalicylic acid' ? 'Aspirin (ASA)' : rule.ingredient} ${rule.strengthMg} mg`,
    detail: `${rule.strengthMg} mg · pack of 20 tablets`, category: rule.ingredient.includes('tirizine') || rule.ingredient === 'loratadine' ? 'Allergy relief' : 'Pain relief',
    priceCents: rule.priceCents!, color: 'blue',
  })),
  { id: 'vitamin-d', name: 'Vitamin D3', detail: '1,000 IU · pack of 30 capsules', category: 'Vitamins', priceCents: 899, color: 'pink' },
  { id: 'vitamin-c', name: 'Vitamin C', detail: '500 mg · pack of 30 tablets', category: 'Vitamins', priceCents: 649, color: 'yellow' },
  { id: 'electrolytes', name: 'Electrolytes', detail: 'Pack · 6 sachets', category: 'Everyday care', priceCents: 599, color: 'blue' },
  { id: 'saline', name: 'Saline nasal spray', detail: 'Pack · 1 bottle', category: 'Everyday care', priceCents: 749, color: 'mint' },
  { id: 'magnesium', name: 'Magnesium', detail: '200 mg · pack of 30 capsules', category: 'Vitamins', priceCents: 1099, color: 'lavender' },
  { id: 'first-aid', name: 'First aid essentials', detail: 'Pack · 12 bandages', category: 'Everyday care', priceCents: 449, color: 'pink' },
];

// This is a deliberately small demo stock list, not a drug-classification service.
// Unknown names, combination products and other strengths always go to a pharmacist.
const scheduleStock = [
  { productId: 'vitamin-d', names: ['vitamin d', 'vitamin d3', 'cholecalciferol'], dosage: /^1000\s*iu\s*[·•]\s*1 capsule$/i },
  { productId: 'vitamin-c', names: ['vitamin c', 'ascorbic acid'], dosage: /^500\s*mg\s*[·•]\s*1 tablet$/i },
  { productId: 'magnesium', names: ['magnesium'], dosage: /^200\s*mg\s*[·•]\s*1 capsule$/i },
];
export const pharmacistReferral: PharmacistReferral = {
  name: 'UTSC Care Pharmacy',
  area: 'Morningside Avenue & Ellesmere Road, near University of Toronto Scarborough',
  message: 'Please seek a licensed pharmacist for prescription medicines and items this machine cannot supply.',
  mock: true,
};
export function dispensingEligibility(dose: Pick<VendingDose, 'name' | 'dosage'>, medicine?: ClassificationMedicine): VendingEligibility {
  const parsed = dose.dosage.trim().match(/^(\d+(?:\.\d+)?)\s*mg\s*[·•]\s*(\d+(?:\.\d+)?)\s+(tablet|capsule)s?$/i);
  const formulation = medicine ?? { genericName: dose.name, dosageForm: parsed?.[3]?.toLowerCase() ?? '',
    ingredients: parsed ? [{ name: dose.name, strengthMg: Number(parsed[1]) }] : [] };
  const classification = classifyCanadianMedicine(formulation);
  const rule = matchingCanadianFormulation(formulation);
  if (rule?.status === 'non_prescription' && parsed && Number(parsed[2]) === 1 && rule.productId) {
    // The snapshot must agree with the verified record, including strength and form.
    const snapshotRule = matchingCanadianFormulation({ genericName: dose.name, dosageForm: parsed[3]!.toLowerCase(), ingredients: [{ name: dose.name, strengthMg: Number(parsed[1]) }] });
    if (snapshotRule?.id === rule.id) return { eligible: true, productId: rule.productId, message: 'Non-prescription · available at this station', classification };
  }
  const namedStock = scheduleStock.find(item => item.names.includes(dose.name.trim().toLowerCase()));
  const stock = namedStock?.dosage.test(dose.dosage.trim()) ? namedStock : undefined;
  // Keep the existing vitamin/mineral stock, classified separately from pharmaceutical drugs.
  const actualIngredient = medicine?.ingredients[0];
  const matchesNaturalHealthRecord = !!medicine && !!parsed && medicine.ingredients.length === 1 &&
    namedStock?.names.includes(medicine.genericName.trim().toLowerCase()) &&
    namedStock.names.includes(actualIngredient!.name.trim().toLowerCase()) &&
    medicine.dosageForm === parsed[3]!.toLowerCase() &&
    (actualIngredient!.strengthMg ?? actualIngredient!.strength) === Number(parsed[1]);
  if (stock && (!medicine || matchesNaturalHealthRecord)) return { eligible: true, productId: stock.productId, message: 'Natural health product · available at this station', classification: naturalHealthCategory() };
  return { eligible: false, classification, message: classification.status === 'prescription'
    ? 'Prescription required. See a licensed pharmacist.'
    : classification.status === 'non_prescription'
      ? 'Non-prescription, but this formulation or quantity is not stocked.'
      : 'Canadian status not verified for this formulation. Ask a licensed pharmacist.' };
}
export function assertDispensablePlan(plan: VendingPlan) {
  if (!plan.items.length || plan.items.some((item) => {
    const product = catalog.find((stock) => stock.id === item.productId);
    if (!product || !Number.isInteger(item.doses) || item.doses < 1) return true;
    return plan.kind === 'schedule'
      ? dispensingEligibility({ name: item.name, dosage: item.description }).productId !== product.id
      : item.id !== product.id || item.name !== product.name;
  })) throw new Error('Only stocked over-the-counter items can be dispensed. Please seek a licensed pharmacist for other medicines.');
}

export function localDate(timezone: string, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
export function schedulePlan(schedule: VendingDose[], startDate: string, days: number, eligibilityForDose: (dose: VendingDose) => VendingEligibility = dispensingEligibility): VendingPlan {
  const endDate = addDays(startDate, days - 1);
  const groups = new Map<string, VendingItem>();
  const referred = new Map<string, VendingItem>();
  for (const dose of schedule) {
    if (dose.date < startDate || dose.date > endDate || dose.status === 'taken' || /as needed/i.test(dose.time)) continue;
    const key = `${dose.name}\u0000${dose.dosage}`;
    const eligibility = eligibilityForDose(dose);
    const target = eligibility.eligible ? groups : referred;
    const item = target.get(key) ?? { id: dose.id, name: dose.name, description: dose.dosage, doses: 0, ...(eligibility.productId ? { productId: eligibility.productId } : {}) };
    item.doses++;
    target.set(key, item);
  }
  const items = [...groups.values()];
  return { kind: 'schedule', items, referrals: [...referred.values()], totalDoses: items.reduce((sum, item) => sum + item.doses, 0), totalCents: 0, startDate, endDate, days };
}
export function purchasePlan(cart: { productId: string; quantity: number }[]): VendingPlan {
  const seen = new Set<string>();
  const items = cart.map(({ productId, quantity }) => {
    const product = catalog.find((item) => item.id === productId);
    if (!product || seen.has(productId)) throw new Error('Choose valid, distinct catalog products.');
    seen.add(productId);
    return { id: product.id, productId: product.id, name: product.name, description: product.detail, doses: quantity, priceCents: product.priceCents };
  });
  return { kind: 'purchase', items, referrals: [], totalDoses: items.reduce((sum, item) => sum + item.doses, 0),
    totalCents: items.reduce((sum, item) => sum + (item.priceCents ?? 0) * item.doses, 0) };
}
