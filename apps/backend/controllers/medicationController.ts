import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../src/db/prisma";

const listQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const idSchema = z.string().min(1).max(100);

export const listMedications = async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }
  const { search, limit, offset } = parsed.data;

  const where = search
    ? { 
        OR: [
          { genericName: { contains: search, mode: "insensitive" as const } },
          { brandName: { contains: search, mode: "insensitive" as const } },
          { purposes: { has: search.toLowerCase() } },
        ],
      }
    : {};

  try {
    const [medications, total] = await Promise.all([
      prisma.medication.findMany({
        where,
        include: { ingredients: true },
        orderBy: { genericName: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.medication.count({ where }),
    ]);
    return res.json({ medications, total, limit, offset });
  } catch (error) {
    console.error("List medications error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMedication = async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid medication id" });
  }

  try {
    const medication = await prisma.medication.findUnique({
      where: { id: parsed.data },
      include: { ingredients: true },
    });
    if (!medication) {
      return res.status(404).json({ error: "Medication not found" });
    }
    return res.json({ medication });
  } catch (error) {
    console.error("Get medication error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};