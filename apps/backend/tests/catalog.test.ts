import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogFormFields } from '../../../packages/apps/mobile/src/lib/medicationCatalog';
import { validateScheduleInput } from '../validation/schedule';

test('catalog selection preserves combination ingredients and warnings without supplying a personal dose', () => {
  const medicine = { id: 'catalog-combination', genericName: 'A + B', brandName: 'Combination', dosageForm: 'tablet' as const,
    ingredients: [{ name: 'A', strengthMg: 40 }, { name: 'B', strengthMg: 5 }], purposes: ['Recorded purpose'],
    warning: ['Recorded warning'], avoidWithConditions: ['Recorded condition'], avoidWithIngredients: ['Recorded interaction'] };
  const fields = catalogFormFields(medicine);
  assert.deepEqual(fields.ingredients, [{ name: 'A', strength: 40 }, { name: 'B', strength: 5 }]);
  assert.equal(fields.catalogMedicationId, medicine.id);
  assert.deepEqual(fields.warning, medicine.warning);
  assert.deepEqual(fields.avoidWithConditions, medicine.avoidWithConditions);
  assert.deepEqual(fields.avoidWithIngredients, medicine.avoidWithIngredients);
  assert.equal('doseAmount' in fields, false);
  assert.equal('Frequency' in fields, false);
});

test('personal dose quantity must be positive and finite', () => {
  const schedule = { times: ['08:00'], startDate: '2026-10-18', frequency: 'once', timezone: 'America/Toronto', daysOfWeek: [] };
  assert.deepEqual(validateScheduleInput({ ...schedule, metadata: { doseAmount: 2 } }), []);
  for (const doseAmount of [0, -1, Infinity, '2']) {
    assert.ok(validateScheduleInput({ ...schedule, metadata: { doseAmount } }).some(error => error.includes('doseAmount')));
  }
});
