import { Router } from "express";
import { Expo } from "expo-server-sdk";
import { prisma } from "../src/db/prisma";

const router = Router();

router.post("/", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ errors: ["not authenticated"] });

  const token = req.body?.token;
  if (typeof token !== "string" || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ errors: ["a valid Expo push token is required"] });
  }

  // If this token was registered to someone else before (shared phone), it moves to this user
  await prisma.pushToken.upsert({
    where: { token },
    update: { userId },
    create: { userId, token },
  });

  res.sendStatus(204);
});

router.delete("/", async (req, res) => {
  if (!req.userId) return res.sendStatus(401);
  const token = req.body?.token;
  if (typeof token !== "string") return res.sendStatus(400);
  await prisma.pushToken.deleteMany({ where: { userId: req.userId, token } });
  res.sendStatus(204);
});

export default router;