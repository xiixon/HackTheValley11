import { Router } from 'express';
import { z } from 'zod';
import type { ChatHealthContext } from '../../../packages/shared/src/types/Chat';
import { ChatServiceError, EMERGENCY_REPLY, generateMedicalReply, mentionsEmergency } from '../src/services/medicalChat';

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1500),
  history: z.array(z.object({ role: z.enum(['user', 'model']), text: z.string().min(1).max(4000) }).strict()).max(12).default([]),
  appMedications: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    name: z.string().max(160), dosage: z.string().max(120), time: z.string().max(40),
    status: z.enum(['taken', 'upcoming']),
  }).strict()).max(30).default([]),
}).strict();

export function createChatRouter(dependencies: {
  getContext: (userId: string) => Promise<ChatHealthContext | null>;
  generateReply?: typeof generateMedicalReply;
}) {
  const router = Router();
  const requests = new Map<string, { resetAt: number; count: number; busy: boolean }>();
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

  router.get('/context', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Please sign in again.' });
    try {
      const context = await dependencies.getContext(req.userId);
      if (!context) return res.status(401).json({ error: 'Please sign in again.' });
      return res.json({ context });
    } catch {
      return res.status(503).json({ error: 'Your shared data could not be loaded. Please try again.' });
    }
  });

  router.post('/', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Please sign in again.' });
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Use a message under 1,500 characters and a valid conversation.' });
    const { message, history, appMedications } = parsed.data;
    if (mentionsEmergency(message) || history.slice(-4).some((item) => item.role === 'user' && mentionsEmergency(item.text))) {
      return res.json({ reply: EMERGENCY_REPLY, emergency: true });
    }

    const now = Date.now();
    for (const [key, value] of requests) if (!value.busy && value.resetAt <= now) requests.delete(key);
    const usage = requests.get(req.userId) ?? { resetAt: now + 60000, count: 0, busy: false };
    if (usage.busy || usage.count >= 10) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'Please wait a minute before sending another message.' });
    }
    usage.count += 1;
    usage.busy = true;
    requests.set(req.userId, usage);
    try {
      const context = await dependencies.getContext(req.userId);
      if (!context) return res.status(401).json({ error: 'Please sign in again.' });
      const reply = await (dependencies.generateReply ?? generateMedicalReply)({ message, history, appMedications, context });
      return res.json({ reply, emergency: false });
    } catch (error) {
      if (error instanceof ChatServiceError) return res.status(error.status).json({ error: error.message });
      // Do not log chat text, health context, tokens, or provider responses.
      return res.status(503).json({ error: 'AI chat is temporarily unavailable. Please try again later.' });
    } finally {
      usage.busy = false;
    }
  });
  return router;
}
