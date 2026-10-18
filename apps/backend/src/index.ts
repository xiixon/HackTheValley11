import express from "express";
<<<<<<< HEAD
import authRoutes from "../routes/auth"
import schedulesRouter from "../routes/schedules"
import { requireAuth } from "../middleware/auth"
import { startReminderJob } from "../jobs/reminderJob"
import pushTokensRouter from "../routes/pushTokens"
=======
import authRoutes from "../routes/auth";
import schedulesRouter from "../routes/schedules";
import { requireAuth } from "../middleware/auth.js";
>>>>>>> a45356f8e0974d1900c5d99f88eeaad803b2a86b

const app = express();

app.use((req, res, next) => {
  if (req.headers.origin === (process.env.APP_ORIGIN ?? "http://localhost:8081")) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.vary("Origin");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json());
app.use("/auth", authRoutes);
<<<<<<< HEAD
app.use("/schedules", schedulesRouter);
app.use("/push-tokens", requireAuth, pushTokensRouter);
=======
app.use("/schedules", requireAuth, schedulesRouter);
>>>>>>> a45356f8e0974d1900c5d99f88eeaad803b2a86b

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
  startReminderJob();
});