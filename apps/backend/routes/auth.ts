import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../src/db/prisma";
import { requireAuth } from ".././middleware/auth";
import { registrationProfileSchema } from "../validation/profile";
import { createVendingCode } from "../src/vending/passes";

const router = Router();

const registerSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email().optional(),
    phone: z.string().min(7).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    profile: registrationProfileSchema.optional(),
  })
  .refine((d) => d.email || d.phone, {
    message: "Provide an email or a phone number",
  });

const loginSchema = z.object({
  email: z.email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
}).refine((d) => d.email || d.phone, {
  message: "Provide an email or a phone number",
});

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: z.treeifyError(parsed.error) });
  }
  const { firstName, lastName, email, phone, password, profile } = parsed.data;

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });
    if (existing) {
      return res.status(409).json({ error: "Account already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        passwordHash,
        vendingPass: { create: { code: createVendingCode() } },
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(profile ? { profile: { create: {
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          sex: profile.sex,
          birthDate: new Date(`${profile.birthDate}T00:00:00.000Z`),
          allergies: profile.allergies ?? [],
          healthConditions: { create: (profile.healthConditions ?? []).map((condition) => ({
            name: condition.name, notes: condition.notes ?? null,
          })) },
        } } } : {}),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    });

    return res.status(201).json({ user, token: signToken(user.id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, phone, password } = parsed.data;

  try {
    const user = await prisma.user.findFirst({
      where: email ? { email } : { phone: phone! },
    });

    // Same message for "no such user" and "wrong password" on purpose
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName },
      token: signToken(user.id),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// Quick way to test that your token works
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });
  return res.json({ user });
});

export default router;
