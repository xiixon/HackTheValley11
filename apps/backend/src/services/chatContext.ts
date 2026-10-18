import type { ChatHealthContext } from '../../../../packages/shared/src/types/Chat';
import { prisma } from '../db/prisma';

export async function getChatContext(userId: string): Promise<ChatHealthContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profile: { select: {
        weightKg: true, heightCm: true, allergies: true,
        healthConditions: { take: 20, select: { name: true, notes: true } },
      } },
      schedules: {
        where: { isActive: true }, take: 30, orderBy: { id: 'asc' },
        select: {
          times: true, frequency: true, daysOfWeek: true,
          startDate: true, endDate: true, timezone: true,
          medication: { select: { genericName: true, dosageForm: true, doseAmount: true } },
        },
      },
    },
  });
  if (!user) return null;
  return {
    profile: user.profile,
    schedules: user.schedules.map(({ medication, ...schedule }) => ({
      ...schedule, medication: medication.genericName,
      dosageForm: medication.dosageForm, doseAmount: medication.doseAmount,
    })),
  };
}
