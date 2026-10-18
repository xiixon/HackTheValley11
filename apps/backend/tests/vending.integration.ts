// Explicit opt-in hardware/API integration test. Runs only with the command in VENDING.md.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { prisma } from '../src/db/prisma';
import { addDays, localDate } from '../src/vending/plans';

const base = process.env.VENDING_TEST_URL || 'http://localhost:3000';
const ids: string[] = [];
let succeeded = false;
async function request(path: string, body?: unknown, auth = '', method = body ? 'POST' : 'GET', status = 200) {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  const result = response.status === 204 ? null : await response.json();
  assert.equal(response.status, status, `${path}: ${JSON.stringify(result)}`);
  return result;
}
try {
  const accounts = [];
  for (let i = 0; i < 2; i++) {
    const account = await request('/auth/register', { firstName: 'Demo', lastName: 'Vending QA',
      email: `vending-qa-${Date.now()}-${i}@example.invalid`, password: 'FictionalTestOnly-2026!' }, '', 'POST', 201);
    ids.push(account.user.id); accounts.push(account);
  }
  const auth = `Bearer ${accounts[0].token}`;
  const pass = await request('/vending/pass', undefined, auth);
  const other = await request('/vending/pass', undefined, `Bearer ${accounts[1].token}`);
  assert.match(pass.code, /^[A-Z0-9]{5}$/); assert.equal(pass.qrValue, `MEDMOBI:${pass.code}`); assert.notEqual(pass.code, other.code);
  assert.equal((await request('/vending/pass', undefined, auth)).code, pass.code);
  const today = localDate('America/Toronto');
  const schedule = [
    { id: 'otc-d', date: today, time: '8:00 AM', name: 'Cholecalciferol', dosage: '1000 IU · 1 capsule', status: 'upcoming' },
    { id: 'rx', date: today, time: '12:30 PM', name: 'Lisinopril', dosage: '10 mg · 1 tablet', status: 'upcoming' },
    { id: 'otc-mg', date: today, time: '8:00 PM', name: 'Magnesium', dosage: '200 mg · 1 capsule', status: 'upcoming' },
    { id: 'high-d', date: addDays(today, 1), time: '8:00 AM', name: 'Cholecalciferol', dosage: '10000 IU · 1 capsule', status: 'upcoming' },
  ];
  const synced = await request('/vending/pass', { schedule, timezone: 'America/Toronto' }, auth, 'PUT');
  assert.equal(synced.code, pass.code);
  const session = await request('/vending/session', { code: pass.qrValue.toLowerCase() });
  const kiosk = `Kiosk ${session.token}`;
  const otherSession = await request('/vending/session', { code: other.code });
  const otherKiosk = `Kiosk ${otherSession.token}`;
  await request('/auth/me', undefined, kiosk, 'GET', 401);
  const data = await request('/vending/kiosk', undefined, kiosk);
  assert.equal(data.schedule.length, 4);
  assert.equal(data.schedule.find((item: any) => item.id === 'rx').dispensing.eligible, false);
  assert.equal(data.pharmacistReferral.mock, true);
  assert.equal((await request('/vending/kiosk', undefined, otherKiosk)).schedule.length, 0);
  await request('/vending/orders', { kind: 'schedule', startDate: today, days: 31 }, kiosk, 'POST', 400);
  await request('/vending/orders', { kind: 'purchase', cart: [{ productId: 'lisinopril', quantity: 1 }] }, kiosk, 'POST', 400);
  const onlyRx = await request('/vending/orders', { kind: 'schedule', startDate: addDays(today, 1), days: 1 }, kiosk, 'POST', 400);
  assert.equal(onlyRx.referrals.length, 1);
  const order = await request('/vending/orders', { kind: 'schedule', startDate: today, days: 1 }, kiosk, 'POST', 201);
  assert.equal(order.status, 'review'); assert.equal(order.plan.totalDoses, 2); assert.equal(order.plan.referrals.length, 1);
  await request(`/vending/orders/${order.id}`, undefined, otherKiosk, 'GET', 404);
  await request(`/vending/orders/${order.id}/confirm`, {}, otherKiosk, 'POST', 404);
  // A stored legacy/tampered prescription preview cannot bypass the confirmation guard.
  const legacy = await prisma.vendingOrder.create({ data: { userId: ids[0]!, kind: 'schedule', plan: {
    ...order.plan, items: [{ id: 'rx', name: 'Lisinopril', description: '10 mg · 1 tablet', doses: 1 }],
  } } });
  await request(`/vending/orders/${legacy.id}/confirm`, {}, kiosk, 'POST', 400);
  await Promise.all([request(`/vending/orders/${order.id}/confirm`, {}, kiosk), request(`/vending/orders/${order.id}/confirm`, {}, kiosk)]);
  let completed = order;
  for (let attempt = 0; attempt < 25; attempt++) {
    completed = await request(`/vending/orders/${order.id}`, undefined, kiosk);
    if (['completed', 'failed'].includes(completed.status)) break;
    await delay(1000);
  }
  assert.equal(completed.status, 'completed', completed.error || 'Order did not complete');
  if (process.env.VENDING_EXPECT_HARDWARE === '1') assert.equal(completed.deviceMode, 'arduino');
  assert.equal(completed.progress, 2);
  assert.equal((await request(`/vending/orders/${order.id}/confirm`, {}, kiosk)).status, 'completed');
  await request('/vending/session', undefined, otherKiosk, 'DELETE', 204);
  await request('/vending/kiosk', undefined, otherKiosk, 'GET', 401);
  succeeded = true;
  if (process.env.VENDING_KEEP_DEMO === '1') await writeFile('/tmp/medimobi-vending-qa.json', JSON.stringify({ userId: ids[0], code: pass.code }));
  console.log(JSON.stringify({ result: 'passed', tests: 'unique/stable pass, QR login, user isolation, OTC exclusions, prescription rejection, repeat confirmation, session end', hardware: data.hardware, completed: { status: completed.status, mode: completed.deviceMode, progress: completed.progress }, ...(process.env.VENDING_KEEP_DEMO === '1' ? { demoCode: pass.code } : {}) }));
} finally {
  const cleanup = succeeded && process.env.VENDING_KEEP_DEMO === '1' ? ids.slice(1) : ids;
  await prisma.user.deleteMany({ where: { id: { in: cleanup } } });
  await prisma.$disconnect();
}
