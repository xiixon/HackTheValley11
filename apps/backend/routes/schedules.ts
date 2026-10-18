import { Router } from "express";
import { prisma } from "../src/db/prisma";             
import { validateScheduleInput } from "../validation/schedule";

const router = Router();

// CREATE
router.post("/", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });

  const body = { frequency: "daily", daysOfWeek: [], timezone: "UTC", isActive: true, ...req.body };

  const errors = validateScheduleInput(body);
  if (typeof body.medicationId !== "string") errors.push("medicationId is required");
  if (typeof body.isActive !== "boolean") errors.push("isActive must be true or false");
  if (errors.length) return res.status(400).json({ errors });

  let medication = await prisma.medication.findUnique({ where: { id: body.medicationId } });
  if (!medication && body.medication && typeof body.medication === "object") {
    const input = body.medication;
    const dosageForms = ["tablet", "capsule", "powder", "liquid", "cream", "inhaler"] as const;
    const dosageForm = dosageForms.includes(input.dosageForm) ? input.dosageForm : "tablet";
    medication = await prisma.medication.create({
      data: {
        id: body.medicationId,
        genericName: String(input.genericName ?? body.medicationId),
        brandName: String(input.brandName ?? input.genericName ?? body.medicationId),
        purposes: Array.isArray(input.purposes) ? input.purposes : [],
        dosageForm,
        frequency: String(input.Frequency ?? "Daily"),
        doseAmount: Number(input.doseAmount ?? 1),
        warning: Array.isArray(input.warning) ? input.warning : [],
        avoidWithConditions: Array.isArray(input.avoidWithConditions) ? input.avoidWithConditions : [],
        avoidWithIngredients: Array.isArray(input.avoidWithIngredients) ? input.avoidWithIngredients : [],
        ingredients: {
          create: Array.isArray(input.ingredients)
            ? input.ingredients.map((ingredient: { name?: unknown; strength?: unknown; strengthMg?: unknown }) => ({
                name: String(ingredient.name ?? ""),
                strengthMg: Number(ingredient.strength ?? ingredient.strengthMg ?? 0),
              }))
            : [],
        },
      },
    });
  }
  if (!medication) return res.status(404).json({ errors: ["medication not found"] });

  const created = await prisma.schedule.create({
    data: {
      userId,
      medicationId: body.medicationId,
      times: body.times,
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      isActive: body.isActive,
      frequency: body.frequency,
      daysOfWeek: body.daysOfWeek,
      timezone: body.timezone,
      intervalDays: body.intervalDays ?? null,
      metadata: body.metadata ?? null,
    },
    include: { medication: true, doseLogs: true },
  });
  res.status(201).json(created);
});

// READ (list mine)
router.get("/", async (req, res) => {
    const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });

  res.json(await prisma.schedule.findMany({ where: { userId }, include: { medication: true, doseLogs: true } }));
});

// READ (one)
router.get("/:id", async (req, res) => {
    const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });

  const schedule = await prisma.schedule.findFirst({ where: { id: req.params.id, userId }, include: { medication: true } });
  if (!schedule) return res.sendStatus(404);
  res.json(schedule);
});

// UPDATE (partial)
router.patch("/:id", async (req, res) => {
    const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });

  const existing = await prisma.schedule.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) return res.sendStatus(404);

  // Only these fields can be changed. The rest of the body is ignored.
  const { times, startDate, endDate, isActive, frequency, daysOfWeek, timezone, intervalDays, metadata, medication } = req.body;
  const merged = {
    times: times ?? existing.times,
    startDate: startDate ?? existing.startDate,
    endDate: endDate !== undefined ? endDate : existing.endDate,
    isActive: isActive ?? existing.isActive,
    frequency: frequency ?? existing.frequency,
    daysOfWeek: daysOfWeek ?? existing.daysOfWeek,
    timezone: timezone ?? existing.timezone,
    intervalDays: intervalDays !== undefined ? intervalDays : existing.intervalDays,
    metadata: metadata !== undefined ? metadata : existing.metadata,
  };
  if (merged.frequency === "daily") merged.daysOfWeek = [];

  const errors = validateScheduleInput(merged);
  if (typeof merged.isActive !== "boolean") errors.push("isActive must be true or false");
  if (errors.length) return res.status(400).json({ errors });

  const updated = await prisma.$transaction(async (transaction) => {
    if (medication && typeof medication === "object") {
      const dosageForms = ["tablet", "capsule", "powder", "liquid", "cream", "inhaler"] as const;
      const dosageForm = dosageForms.includes(medication.dosageForm) ? medication.dosageForm : undefined;
      const medicationData = {
        genericName: medication.genericName,
        brandName: medication.brandName,
        purposes: medication.purposes,
        ...(dosageForm ? { dosageForm } : {}),
        frequency: medication.Frequency,
        doseAmount: medication.doseAmount,
        warning: medication.warning,
        avoidWithConditions: medication.avoidWithConditions,
        avoidWithIngredients: medication.avoidWithIngredients,
      };
      if (Array.isArray(medication.ingredients)) {
        Object.assign(medicationData, {
          ingredients: {
            deleteMany: {},
            create: medication.ingredients.map((ingredient: { name?: unknown; strength?: unknown; strengthMg?: unknown }) => ({
              name: String(ingredient.name ?? ""),
              strengthMg: Number(ingredient.strength ?? ingredient.strengthMg ?? 0),
            })),
          },
        });
      }
      await transaction.medication.update({
        where: { id: existing.medicationId },
        data: medicationData,
      });
    }
    return transaction.schedule.update({
      where: { id: existing.id },
      data: merged,
      include: { medication: { include: { ingredients: true } }, doseLogs: true },
    });
  });
  res.json(updated);
});

router.put("/:id/doses/:localDate/:time", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });
  const schedule = await prisma.schedule.findFirst({ where: { id: req.params.id, userId } });
  if (!schedule) return res.sendStatus(404);
  const { localDate, time } = req.params;
  const log = await prisma.doseLog.upsert({
    where: { scheduleId_localDate_time: { scheduleId: schedule.id, localDate, time } },
    create: { scheduleId: schedule.id, localDate, time, takenAt: new Date() },
    update: { takenAt: new Date() },
  });
  res.json(log);
});

router.delete("/:id/doses/:localDate/:time", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });
  const schedule = await prisma.schedule.findFirst({ where: { id: req.params.id, userId } });
  if (!schedule) return res.sendStatus(404);
  await prisma.doseLog.deleteMany({
    where: { scheduleId: schedule.id, localDate: req.params.localDate, time: req.params.time },
  });
  res.sendStatus(204);
});

// DELETE
router.delete("/:id", async (req, res) => {
    const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });

  const { count } = await prisma.schedule.deleteMany({ where: { id: req.params.id, userId } });
  res.sendStatus(count ? 204 : 404);
});

export default router;