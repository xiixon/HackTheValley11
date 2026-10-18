import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidBirthDate } from '../../../packages/shared/src/validation/profile';
import { profileUpdateSchema, registrationProfileSchema } from '../validation/profile';

const profile = { sex: 'female', birthDate: '2000-02-29', weightKg: 65.5, heightCm: 170 };

test('birth dates must be real calendar dates within the supported range', () => {
  const today = new Date('2026-10-17T12:00:00Z');
  for (const date of ['2000-02-29', '2026-10-17', '1906-10-17']) {
    assert.equal(isValidBirthDate(date, today), true, date);
  }
  for (const date of ['2001-02-29', '2000-02-30', '2000-13-01', '2026-10-18', '1906-10-16', '05/21/2000', '']) {
    assert.equal(isValidBirthDate(date, today), false, date);
  }
});

test('registration requires every core profile field and validates units and lists', () => {
  assert.equal(registrationProfileSchema.safeParse(profile).success, true);
  for (const field of ['sex', 'birthDate', 'weightKg', 'heightCm']) {
    const incomplete: Record<string, unknown> = { ...profile };
    delete incomplete[field];
    assert.equal(registrationProfileSchema.safeParse(incomplete).success, false, field);
  }
  for (const invalid of [{ sex: 'unknown' }, { weightKg: 0 }, { weightKg: 501 }, { heightCm: 301 },
    { weightKg: '65' }, { birthDate: '2000-02-30' }, { allergies: [' '] }, { healthConditions: [{ name: '' }] }]) {
    assert.equal(registrationProfileSchema.safeParse({ ...profile, ...invalid }).success, false);
  }
  assert.equal(registrationProfileSchema.safeParse({ ...profile, allergies: Array(21).fill('Example') }).success, false);
});

test('partial profile updates do not add empty lists that erase existing data', () => {
  assert.deepEqual(profileUpdateSchema.parse({ weightKg: 70 }), { weightKg: 70 });
  assert.deepEqual(profileUpdateSchema.parse({ allergies: [] }), { allergies: [] });
  assert.deepEqual(registrationProfileSchema.parse({ ...profile, healthConditions: [{ name: ' Asthma ' }] }).healthConditions,
    [{ name: 'Asthma' }]);
});
