import { randomBytes } from 'node:crypto';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../src/db/prisma';
import { ensureVendingPass } from '../src/vending/passes';
import { addDays, catalog, localDate, purchasePlan, schedulePlan, dispensingEligibility, pharmacistReferral, assertDispensablePlan } from '../src/vending/plans';
import { enqueueOrder, hardwareStatus } from '../src/vending/dispenser';
import type { VendingDose, VendingPlan } from '../../../packages/shared/src/types/Vending';

const router = Router();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
const doseSchema = z.object({ id: z.string().min(1).max(180), date, time: z.string().min(1).max(60),
  name: z.string().min(1).max(160), dosage: z.string().max(120), status: z.enum(['upcoming', 'taken']) });
const syncSchema = z.object({ schedule: z.array(doseSchema).max(3000), timezone: z.string().max(80).refine((value) => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return true; } catch { return false; }
}) });
const sessions = new Map<string, { userId: string; expires: number }>();
function requireKiosk(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Kiosk ') ? header.slice(6) : '';
  const session = sessions.get(token);
  if (!session || session.expires < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Your kiosk session ended. Scan or enter your code again.' });
  }
  req.userId = session.userId;
  next();
}
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
router.get('/pass', requireAuth, async (req, res) => {
  const pass = await ensureVendingPass(req.userId!);
  res.json({ code: pass.code, qrValue: `MEDMOBI:${pass.code}`, syncedAt: pass.syncedAt, doseCount: (pass.schedule as VendingDose[]).length });
});
router.put('/pass', requireAuth, async (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'The schedule could not be synced. Check its dates and details.' });
  await ensureVendingPass(req.userId!);
  const pass = await prisma.vendingPass.update({ where: { userId: req.userId! },
    data: { schedule: parsed.data.schedule, timezone: parsed.data.timezone, syncedAt: new Date() } });
  return res.json({ code: pass.code, qrValue: `MEDMOBI:${pass.code}`, syncedAt: pass.syncedAt, doseCount: parsed.data.schedule.length });
});
router.post('/session', async (req, res) => {
  const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase().replace(/^(?:MEDMOBI|MEDIMOBI|INTELLIMED):/, '') : '';
  if (!/^[A-Z0-9]{5}$/.test(code)) return res.status(400).json({ error: 'Enter the five-character code from your app.' });
  const pass = await prisma.vendingPass.findUnique({ where: { code }, include: { user: { select: { firstName: true } } } });
  if (!pass) return res.status(404).json({ error: 'That code was not found. Check the Vending tab in your app.' });
  for (const [key, value] of sessions) if (value.expires < Date.now()) sessions.delete(key);
  const token = randomBytes(24).toString('hex');
  sessions.set(token, { userId: pass.userId, expires: Date.now() + 30 * 60 * 1000 });
  return res.json({ token, firstName: pass.user.firstName });
});
router.delete('/session', (req, res) => {
  sessions.delete(req.headers.authorization?.replace(/^Kiosk /, '') ?? '');
  res.sendStatus(204);
});
router.get('/kiosk', requireKiosk, async (req, res) => {
  const pass = await prisma.vendingPass.findUniqueOrThrow({ where: { userId: req.userId! } });
  return res.json({ schedule: (pass.schedule as VendingDose[]).map((dose) => ({ ...dose, dispensing: dispensingEligibility(dose) })), pharmacistReferral, syncedAt: pass.syncedAt, timezone: pass.timezone, today: localDate(pass.timezone), catalog, hardware: await hardwareStatus() });
});
const previewSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('schedule'), startDate: date, days: z.number().int().min(1).max(30) }),
  z.object({ kind: z.literal('purchase'), cart: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(10) })).min(1).max(6) }),
]);
router.post('/orders', requireKiosk, async (req, res) => {
  const parsed = previewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose 1–30 days or valid product quantities.' });
  try {
    const pass = await prisma.vendingPass.findUniqueOrThrow({ where: { userId: req.userId! } });
    if (parsed.data.kind === 'schedule' && (parsed.data.startDate < localDate(pass.timezone) || parsed.data.startDate > addDays(localDate(pass.timezone), 365))) {
      return res.status(400).json({ error: 'Choose a start date from today through the next year.' });
    }
    const plan = parsed.data.kind === 'schedule'
      ? schedulePlan(pass.schedule as VendingDose[], parsed.data.startDate, parsed.data.days)
      : purchasePlan(parsed.data.cart);
    if (!plan.items.length) return res.status(400).json({ error: plan.referrals.length ? 'No stocked over-the-counter doses in this range. Please seek a licensed pharmacist for the medicines shown below.' : 'No unlogged scheduled doses in this date range. Sync your schedule from the Vending tab or choose another range.', referrals: plan.referrals, pharmacistReferral });
    assertDispensablePlan(plan);
    const order = await prisma.vendingOrder.create({ data: { userId: req.userId!, kind: plan.kind, plan } });
    return res.status(201).json(order);
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not prepare this order.' }); }
});
router.post('/orders/:id/confirm', requireKiosk, async (req, res) => {
  const preview = await prisma.vendingOrder.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!preview) return res.status(404).json({ error: 'Order not found.' });
  if (preview.status === 'review') {
    try { assertDispensablePlan(preview.plan as VendingPlan); }
    catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  }
  const changed = await prisma.vendingOrder.updateMany({ where: { id: String(req.params.id), userId: req.userId!, status: 'review' }, data: { status: 'queued' } });
  if (changed.count) enqueueOrder(String(req.params.id));
  const order = await prisma.vendingOrder.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  return res.json(order);
});
router.get('/orders/:id', requireKiosk, async (req, res) => {
  const order = await prisma.vendingOrder.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  return res.json(order);
});
router.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Vending request failed:', error.name);
  res.status(500).json({ error: 'The vending service could not complete this request. Please try again.' });
});
export default router;
