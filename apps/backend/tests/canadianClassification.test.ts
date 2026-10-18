import assert from 'node:assert/strict';
import test from 'node:test';
import { canadianFormulations, classifyCanadianMedicine } from '../../../packages/shared/src/canadianClassification';
import { assertDispensablePlan, dispensingEligibility, schedulePlan } from '../src/vending/plans';
import { validateScheduleInput } from '../validation/schedule';

const medicine = (name: string, strengthMg: number, dosageForm = 'tablet') => ({ genericName: name, dosageForm, ingredients: [{ name, strengthMg }] });
test('reviewed Canadian formulations retain government sources and prescription status', () => {
  for (const rule of canadianFormulations) {
    const result = classifyCanadianMedicine(medicine(rule.ingredient, rule.strengthMg, rule.dosageForm));
    assert.equal(result.status, rule.status);
    assert.equal(result.scope, 'formulation_reference');
    assert.match(result.sourceUrl!, /^https:\/\/(?:www\.|health-products\.|produits-sante\.|recalls-rappels\.)?canada\.ca\//);
  }
});
test('known synonyms match without treating another strength or salt as equivalent', () => {
  assert.equal(classifyCanadianMedicine(medicine('paracetamol', 500)).status, 'non_prescription');
  assert.equal(classifyCanadianMedicine(medicine('aspirin', 325)).status, 'non_prescription');
  for (const med of [medicine('aspirin', 300), medicine('cetirizine', 10), medicine('cetirizine hydrochloride', 20), medicine('ibuprofen', 600), medicine('acetaminophen', 500, 'liquid')]) {
    assert.equal(classifyCanadianMedicine(med).status, 'unverified');
  }
});
test('combinations, conflicting ingredients, and modified release do not inherit OTC classification', () => {
  for (const med of [
    { ...medicine('acetaminophen', 500), ingredients: [{ name: 'acetaminophen', strengthMg: 500 }, { name: 'codeine', strengthMg: 30 }] },
    { ...medicine('acetaminophen', 500), ingredients: [{ name: 'tramadol', strengthMg: 50 }] },
    { ...medicine('acetaminophen', 500), brandName: 'Acetaminophen XR' },
  ]) assert.equal(classifyCanadianMedicine(med).status, 'unverified');
});
test('common stocked non-prescription doses can be reviewed; unavailable or prescription doses cannot', () => {
  const doses = ['Aspirin', 'Paracetamol', 'Ibuprofen'].map((name, i) => ({ id: String(i), name, dosage: `${[325, 500, 200][i]} mg · 1 tablet`, date: '2026-10-23', time: '8:00 AM', status: 'upcoming' as const }));
  const plan = schedulePlan(doses, '2026-10-23', 1);
  assert.equal(plan.items.length, 3);
  assert.doesNotThrow(() => assertDispensablePlan(plan));
  assert.equal(dispensingEligibility({ name: 'Aspirin', dosage: '300 mg · 1 tablet' }).eligible, false);
  const quantity = dispensingEligibility({ name: 'Aspirin', dosage: '325 mg · 2 tablets' });
  assert.equal(quantity.classification?.status, 'non_prescription');
  assert.equal(quantity.eligible, false);
  assert.equal(dispensingEligibility({ name: 'Amlodipine', dosage: '5 mg · 1 tablet' }).classification?.status, 'prescription');
  const spoofed = dispensingEligibility(doses[0]!, medicine('amoxicillin', 500, 'capsule'));
  assert.equal(spoofed.eligible, false);
  assert.equal(dispensingEligibility({ name: 'Cholecalciferol', dosage: '1000 IU · 1 capsule' }, medicine('amoxicillin', 500, 'capsule')).eligible, false);
});
test('a selected weekday must actually occur before the schedule ends', () => {
  const schedule = { times: ['08:00'], startDate: '2026-10-18', endDate: '2026-10-18', frequency: 'weekly', daysOfWeek: ['monday'], timezone: 'America/Toronto' };
  assert.ok(validateScheduleInput(schedule).some(error => error.includes('No selected weekday')));
  assert.deepEqual(validateScheduleInput({ ...schedule, endDate: '2026-10-19' }), []);
  assert.deepEqual(validateScheduleInput({ ...schedule, endDate: null }), []);
});
