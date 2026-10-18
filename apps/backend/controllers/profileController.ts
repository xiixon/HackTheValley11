import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../src/db/prisma";

const conditionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  notes: z.string().max(500).optional(),
});

const profileSchema = z.object({
  weightKg: z.number().positive().max(500).optional(),
  heightCm: z.number().positive().max(300).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((d) => !Number.isNaN(Date.parse(d)), "Invalid date")
    .refine((d) => new Date(d) <= new Date(), "Birth date cannot be in the future")
    .refine((d) => new Date(d).getFullYear() >= new Date().getFullYear() - 120, "Birth date is too far in the past")
    .optional(),
  allergies: z.array(z.string().trim().min(1).max(100)).optional(),
  healthConditions: z.array(conditionSchema).optional(),
});

export const getUserProfile = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { healthConditions: true },
    });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Internal server error a" });
  }
};

export const upsertUserProfile = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }
  const { weightKg, heightCm, sex, birthDate, allergies, healthConditions } = parsed.data;

  const conditionData = healthConditions?.map((c) => ({
    name: c.name,
    notes: c.notes ?? null,
  }));

  try {
    const existing = await prisma.profile.findUnique({
      where: { userId },
      select: { userId: true },
    });

    // First time: weight and height are mandatory
    if (!existing) {
      if (
        weightKg === undefined || heightCm === undefined ||
        sex === undefined || birthDate === undefined
      ) {
        return res.status(400).json({
          error: "weightKg, heightCm, sex and birthDate are required to create a profile",
        });
      }

      const profile = await prisma.profile.create({
        data: {
          userId,
          weightKg,
          heightCm,
          sex,
          birthDate: new Date(birthDate),
          allergies: allergies ?? [],
          ...(conditionData !== undefined
            ? { healthConditions: { create: conditionData } }
            : {}),
        },
        include: { healthConditions: true },
      });
      return res.status(201).json({ message: "Profile created", profile });
    }

    // Afterwards: update only the fields that were sent
    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        ...(weightKg !== undefined ? { weightKg } : {}),
        ...(heightCm !== undefined ? { heightCm } : {}),
        ...(sex !== undefined ? { sex } : {}),
        ...(birthDate !== undefined ? { birthDate: new Date(birthDate) } : {}),
        ...(allergies !== undefined ? { allergies } : {}),
        ...(conditionData !== undefined
          ? { healthConditions: { deleteMany: {}, create: conditionData } }
          : {}),
      },
      include: { healthConditions: true },
    });
    return res.json({ message: "Profile updated", profile });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ error: "Internal server error b" });
  }
};

