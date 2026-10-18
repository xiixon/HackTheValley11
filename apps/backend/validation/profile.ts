import { z } from 'zod';
import { isValidBirthDate } from '../../../packages/shared/src/validation/profile';

export const registrationProfileSchema = z.object({
  weightKg: z.number().positive().max(500),
  heightCm: z.number().positive().max(300),
  sex: z.enum(['male', 'female', 'other']),
  birthDate: z.string().refine(isValidBirthDate, 'Use a real birth date in YYYY-MM-DD, within the past 120 years.'),
  allergies: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  healthConditions: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    notes: z.string().max(500).optional(),
  })).max(20).optional(),
});

export const profileUpdateSchema = registrationProfileSchema.partial();
