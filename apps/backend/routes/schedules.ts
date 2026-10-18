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

  const medication = await prisma.medication.findUnique({ where: { id: body.medicationId } });
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
    },
    include: { medication: true },
  });
  res.status(201).json(created);
});

// READ (list mine)
router.get("/", async (req, res) => {
    const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });

  res.json(await prisma.schedule.findMany({ where: { userId }, include: { medication: true } }));
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
  const { times, startDate, endDate, isActive, frequency, daysOfWeek, timezone } = req.body;
  const merged = {
    times: times ?? existing.times,
    startDate: startDate ?? existing.startDate,
    endDate: endDate !== undefined ? endDate : existing.endDate,
    isActive: isActive ?? existing.isActive,
    frequency: frequency ?? existing.frequency,
    daysOfWeek: daysOfWeek ?? existing.daysOfWeek,
    timezone: timezone ?? existing.timezone,
  };
  if (merged.frequency === "daily") merged.daysOfWeek = [];

  const errors = validateScheduleInput(merged);
  if (typeof merged.isActive !== "boolean") errors.push("isActive must be true or false");
  if (errors.length) return res.status(400).json({ errors });

  res.json(await prisma.schedule.update({ where: { id: existing.id }, data: merged, include: { medication: true }}));
});

// DELETE
router.delete("/:id", async (req, res) => {
    const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });

  const { count } = await prisma.schedule.deleteMany({ where: { id: req.params.id, userId } });
  res.sendStatus(count ? 204 : 404);
});

export default router;