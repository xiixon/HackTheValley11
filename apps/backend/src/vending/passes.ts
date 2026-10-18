import { randomInt } from 'node:crypto';
import { prisma } from '../db/prisma';
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const createVendingCode = () => Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join('');
export async function ensureVendingPass(userId: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      return await prisma.vendingPass.upsert({ where: { userId }, update: {}, create: { userId, code: createVendingCode() } });
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error;
    }
  }
  throw new Error('Could not allocate a vending code. Try again.');
}
