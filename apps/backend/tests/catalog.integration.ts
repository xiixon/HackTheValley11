// Opt-in live API check. Creates an isolated fictional account; leaves catalog facts unchanged.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { prisma } from '../src/db/prisma';
let userId = '', token = '';
let keep = false;
const email = `catalog-qa-${Date.now()}@example.invalid`;
async function request(path: string, method = 'GET', body?: unknown, expected = 200) {
  const response = await fetch(`http://127.0.0.1:3000${path}`, { method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  const data = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(data)}`);
  return data;
}
try {
  await request('/medications', 'GET', undefined, 401);
  const account = await request('/auth/register', 'POST', { email, password: 'FictionalCatalogTest-2026!', firstName: 'Catalog', lastName: 'QA' }, 201);
  userId = account.user.id; token = account.token;
  const countBefore = await prisma.medication.count();
  const list = await request('/medications?limit=20');
  assert.equal(list.total, countBefore);
  assert.equal(list.medications.length, Math.min(20, countBefore));
  await request('/medications?limit=200', 'GET', undefined, 400);
  const search = await request('/medications?search=telmisartan&limit=100');
  const medicine = search.medications.find((item: any) => item.ingredients.length > 1);
  assert.ok(medicine, 'Expected a combination medicine in the live database');
  const original = (await request(`/medications/${medicine.id}`)).medication;
  const created = await request('/schedules', 'POST', { medicationId: medicine.id, times: ['08:00'], startDate: '2099-10-18', endDate: '2099-10-18', frequency: 'once', daysOfWeek: [], timezone: 'America/Toronto', metadata: { catalogMedicationId: medicine.id, doseAmount: 2 } }, 201);
  assert.deepEqual(created.medication.ingredients, original.ingredients);
  assert.deepEqual(created.medication.warning, original.warning);
  assert.equal(created.metadata.doseAmount, 2);
  const updated = await request(`/schedules/${created.id}`, 'PATCH', { metadata: { catalogMedicationId: medicine.id, doseAmount: 3 } });
  assert.equal(updated.metadata.doseAmount, 3);
  assert.deepEqual((await request(`/medications/${medicine.id}`)).medication, original);
  await request(`/schedules/${created.id}`, 'PATCH', { medication: { genericName: 'Should never overwrite catalog' } }, 400);
  const other = list.medications.find((item: any) => item.id !== medicine.id);
  const changed = await request(`/schedules/${created.id}`, 'PATCH', { medicationId: other.id, metadata: { catalogMedicationId: other.id, doseAmount: 1 } });
  assert.equal(changed.medication.id, other.id);
  assert.deepEqual(changed.medication.ingredients, other.ingredients);
  await prisma.reminderLog.create({ data: { scheduleId: created.id, localDate: '2099-10-18', time: '08:00' } });
  await request(`/schedules/${created.id}`, 'DELETE', undefined, 204);
  assert.equal(await prisma.medication.count(), countBefore);
  keep = process.env.CATALOG_KEEP_QA === '1';
  if (keep) await writeFile('/tmp/medimobi-catalog-qa.json', JSON.stringify({ userId, email }));
  console.log(JSON.stringify({ passed: true, catalogCount: countBefore, checks: 'live search, combination ingredients, warnings, personal dose, catalog immutability, changing medicine, deleting schedule', ...(keep ? { email } : {}) }));
} finally {
  if (userId && !keep) {
    await prisma.reminderLog.deleteMany({ where: { schedule: { userId } } });
    await prisma.schedule.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  }
  await prisma.$disconnect();
}
