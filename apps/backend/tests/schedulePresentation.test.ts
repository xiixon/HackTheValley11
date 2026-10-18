import assert from 'node:assert/strict';
import test from 'node:test';
import { expand, type BackendSchedule } from '../../../packages/apps/mobile/src/lib/schedulePresentation';
import { getMedicationDisplayStatus } from '../../../packages/apps/mobile/src/types/medication';
import { isScheduledDose } from '../validation/dose';

const now = new Date('2026-10-18T12:00:00');
const schedule: BackendSchedule = {
  id: 'schedule', medicationId: 'catalog-medicine', timezone: 'America/Toronto', isActive: true,
  medication: { id: 'catalog-medicine', genericName: 'Test medicine', brandName: 'Test', ingredients: [],
    purposes: [], dosageForm: 'tablet', warning: [], avoidWithConditions: [], avoidWithIngredients: [] },
  times: ['08:00'], startDate: '2020-01-01', frequency: 'daily', daysOfWeek: [], doseLogs: [],
};

test('old and open-ended recurring schedules include today and future dates', () => {
  const dates = expand(schedule, now);
  assert.equal(dates['2026-10-18']?.length, 1);
  assert.equal(dates['2027-01-01']?.length, 1);
  assert.equal(dates['2026-10-18']?.[0]?.endDate, '');
  assert.ok(Object.keys(dates).length <= 733, 'Calendar projection stays bounded');
});

test('calendar respects weekly weekdays, range boundaries, once, and inactive schedules', () => {
  const weekly = expand({ ...schedule, frequency: 'weekly', daysOfWeek: ['monday'], startDate: '2026-10-18', endDate: '2026-10-26' }, now);
  assert.deepEqual(Object.keys(weekly), ['2026-10-19', '2026-10-26']);
  assert.deepEqual(Object.keys(expand({ ...schedule, frequency: 'once', startDate: '2026-10-18' }, now)), ['2026-10-18']);
  assert.deepEqual(expand({ ...schedule, isActive: false }, now), {});
});

test('old recorded doses remain in history, but null takenAt does not mark a dose taken', () => {
  const dates = expand({ ...schedule, doseLogs: [
    { localDate: '2020-01-01', time: '08:00', takenAt: '2020-01-01T13:00:00Z' },
    { localDate: '2026-10-18', time: '08:00', takenAt: null },
  ] }, now);
  assert.equal(dates['2020-01-01']?.[0]?.status, 'taken');
  assert.equal(dates['2026-10-18']?.[0]?.status, 'upcoming');
  assert.equal(getMedicationDisplayStatus(dates['2026-10-18']![0]!, now), 'missed');
});

test('as-needed doses are not incorrectly marked missed', () => {
  const dates = expand({ ...schedule, frequency: 'as_needed', startDate: '2026-10-17', endDate: '2026-10-18' }, now);
  assert.equal(getMedicationDisplayStatus(dates['2026-10-17']![0]!, now), 'upcoming');
});

test('dose logging rejects impossible dates, wrong times, and non-occurring days', () => {
  const weekly = { ...schedule, frequency: 'weekly', daysOfWeek: ['monday'] };
  assert.equal(isScheduledDose(weekly, '2026-10-19', '08:00'), true);
  for (const [date, time] of [['2026-10-18', '08:00'], ['2026-10-19', '09:00'], ['2026-02-30', '08:00'], ['2026-10-19', '25:00']]) {
    assert.equal(isScheduledDose(weekly, date!, time!), false);
  }
  assert.equal(isScheduledDose({ ...schedule, frequency: 'as_needed' }, '2026-10-18', '08:00'), true);
});
