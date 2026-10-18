import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, assertDispensablePlan, dispensingEligibility, localDate, purchasePlan, schedulePlan } from '../src/vending/plans';
import type { VendingDose } from '../../../packages/shared/src/types/Vending';

const dose = (id: string, changes: Partial<VendingDose> = {}): VendingDose => ({
  id, date: '2026-10-17', time: '8:00 AM', name: 'Cholecalciferol', dosage: '1000 IU · 1 capsule', status: 'upcoming', ...changes,
});
test('schedule pickup includes only stocked OTC formulations and refers prescription and unknown medicines', () => {
  const plan = schedulePlan([dose('a'), dose('b', { name: 'Lisinopril', dosage: '10 mg · 1 tablet' }),
    dose('c', { name: 'Cholecalciferol', dosage: '10000 IU · 1 capsule' }), dose('d', { name: 'Unknown medicine' })], '2026-10-17', 1);
  assert.equal(plan.items.length, 1);
  assert.equal(plan.totalDoses, 1);
  assert.equal(plan.referrals.length, 3);
  assert.doesNotThrow(() => assertDispensablePlan(plan));
});
test('OTC matching is exact; combination names, missing strengths and other formulations are referred', () => {
  for (const changes of [{ name: 'Vitamin D3 + Lisinopril' }, { dosage: '1 capsule' }, { dosage: '10000 IU · 1 capsule' },
    { name: 'Magnesium', dosage: '200 mg · 2 capsules' }]) assert.equal(dispensingEligibility(dose('a', changes)).eligible, false);
  assert.equal(dispensingEligibility(dose('a', { name: '  VITAMIN D3 ' })).eligible, true);
});
test('date ranges are inclusive and exclude taken, as-needed and unsynced doses', () => {
  const plan = schedulePlan([dose('a'), dose('b', { date: '2026-10-18' }), dose('c', { date: '2026-10-19' }),
    dose('d', { status: 'taken' }), dose('e', { time: 'As needed' }), dose('f', { date: '2026-10-16' })], '2026-10-17', 2);
  assert.equal(plan.endDate, '2026-10-18');
  assert.equal(plan.items.length, 1);
  assert.equal(plan.totalDoses, 2);
  assert.equal(schedulePlan([], '2026-10-17', 30).totalDoses, 0);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(localDate('America/Toronto', new Date('2026-10-18T01:00:00Z')), '2026-10-17');
});
test('purchase prices and products come from the server stock list', () => {
  const plan = purchasePlan([{ productId: 'vitamin-d', quantity: 2 }, { productId: 'saline', quantity: 1 }]);
  assert.equal(plan.totalCents, 2 * 899 + 749);
  assert.equal(plan.totalDoses, 3);
  assert.doesNotThrow(() => assertDispensablePlan(plan));
  assert.throws(() => purchasePlan([{ productId: 'lisinopril', quantity: 1 }]));
  assert.throws(() => purchasePlan([{ productId: 'saline', quantity: 1 }, { productId: 'saline', quantity: 1 }]));
});
test('old or tampered prescription orders are blocked again before hardware execution', () => {
  const plan = purchasePlan([{ productId: 'vitamin-d', quantity: 1 }]);
  plan.items[0]!.name = 'Lisinopril';
  assert.throws(() => assertDispensablePlan(plan));
  const schedule = schedulePlan([dose('a')], '2026-10-17', 1);
  schedule.items[0]!.description = '10000 IU · 1 capsule';
  assert.throws(() => assertDispensablePlan(schedule));
  delete schedule.items[0]!.productId;
  assert.throws(() => assertDispensablePlan(schedule));
});
