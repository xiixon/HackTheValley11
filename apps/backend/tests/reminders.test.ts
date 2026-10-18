import assert from 'node:assert/strict';
import test from 'node:test';
import { findDue } from '../services/reminderService';
import { planReminders, type NotificationSchedule } from '../../../packages/apps/mobile/src/notifications/planner';
import { occursOnDate, zonedDate } from '../../../packages/shared/src/reminders';

const schedule: NotificationSchedule = {
  id: 'test-schedule', medicationId: 'test-medication',
  medication: { genericName: 'Vitamin C', brandName: 'Vitamin C' },
  times: ['00:05'], startDate: '2026-10-18', endDate: '2026-10-20',
  frequency: 'daily', daysOfWeek: [], timezone: 'America/Toronto', isActive: true,
  metadata: { notificationOffsets: [0, 10] },
};

test('an advance reminder crosses midnight into the preceding day, including the first dose', () => {
  const now = new Date('2026-10-18T03:55:00Z'); // Oct 17, 23:55 Toronto
  const due = findDue([schedule], now);
  assert.equal(due.length, 1);
  assert.equal(due[0]?.localDate, '2026-10-18');
  assert.equal(due[0]?.offset, 10);
  assert.equal(findDue([schedule], new Date('2026-10-18T04:05:00Z'))[0]?.offset, 0);
});

test('all recurrence types use the same calendar rules on the server and device', () => {
  const date = '2026-10-19'; // Monday
  for (const [frequency, extra, expected] of [
    ['daily', {}, true], ['once_daily', {}, true], ['once', {}, false],
    ['as_needed', {}, false], ['selected_days', { daysOfWeek: ['sunday'] }, false],
    ['weekly', { daysOfWeek: ['monday'] }, true],
    ['every_n_days', { intervalDays: 2 }, false], ['monthly', {}, false],
  ] as const) {
    const input = { ...schedule, frequency, ...extra, daysOfWeek: [...('daysOfWeek' in extra ? extra.daysOfWeek : [])] };
    assert.equal(occursOnDate(input, date), expected, frequency);
    assert.equal(findDue([input], new Date(`${date}T04:05:00Z`)).length > 0, expected, frequency);
  }
});

test('inactive, expired, taken, as-needed and invalid-zone schedules do not alert', () => {
  const taken = { ...schedule, doseLogs: [{ localDate: '2026-10-18', time: '00:05', takenAt: new Date() }] };
  const inputs = [
    { ...schedule, isActive: false }, { ...schedule, endDate: '2026-10-17' },
    { ...schedule, frequency: 'as_needed' }, { ...schedule, timezone: 'invalid/zone' }, taken,
  ];
  for (const input of inputs) assert.deepEqual(findDue([input], new Date('2026-10-18T04:05:00Z')), []);
  const plan = planReminders([taken], new Date('2026-10-18T03:00:00Z'));
  assert.ok(plan.every((reminder) => reminder.data.localDate !== '2026-10-18'));
});

test('iOS plan honors offsets, silence, timezone and stable identifiers without duplicates', () => {
  const plan = planReminders([{ ...schedule, times: ['00:05', '00:05'], metadata: { notificationOffsets: [10, 10, 0], notificationSound: 'silent' } }], new Date('2026-10-18T03:00:00Z'));
  assert.equal(plan.length, 6);
  assert.equal(plan[0]?.date.toISOString(), '2026-10-18T03:55:00.000Z');
  assert.equal(plan[0]?.sound, false);
  assert.equal(new Set(plan.map((reminder) => reminder.identifier)).size, plan.length);
});

test('iOS plan retains the nearest 60 notifications and skips past times', () => {
  const plan = planReminders([{ ...schedule, endDate: null }], new Date('2026-10-18T04:01:00Z'));
  assert.equal(plan.length, 60);
  assert.equal(plan[0]?.date.toISOString(), '2026-10-18T04:05:00.000Z');
  assert.ok(plan.every((reminder, index) => index === 0 || reminder.date >= plan[index - 1]!.date));
});

test('removing a schedule removes it from the desired device plan', () => {
  assert.deepEqual(planReminders([], new Date('2026-10-18T04:00:00Z')), []);
});

test('date conversion follows daylight-saving changes and rejects nonexistent clock times', () => {
  assert.equal(zonedDate('2026-10-31', '08:00', 'America/Toronto')?.toISOString(), '2026-10-31T12:00:00.000Z');
  assert.equal(zonedDate('2026-11-01', '08:00', 'America/Toronto')?.toISOString(), '2026-11-01T13:00:00.000Z');
  assert.equal(zonedDate('2026-03-08', '02:30', 'America/Toronto'), null);
});
