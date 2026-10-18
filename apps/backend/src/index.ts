import express, { type ErrorRequestHandler } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vendingRoutes from "../routes/vending";
import { recoverInterruptedOrders } from "./vending/dispenser";
import authRoutes from "../routes/auth"
import profileRoutes from "../routes/profile"
import schedulesRouter from "../routes/schedules"
import medicationRoutes from "../routes/medications";
import { requireAuth } from "../middleware/auth"
import { startReminderJob } from "../jobs/reminderJob"
import pushTokensRouter from "../routes/pushTokens"
import { createChatRouter } from "../routes/chat";
import { getChatContext } from "./services/chatContext";

const app = express();

app.use((req, res, next) => {
  if (req.headers.origin === (process.env.APP_ORIGIN ?? "http://localhost:8081")) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.vary("Origin");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use('/vending', vendingRoutes);
const kioskDirectory = fileURLToPath(new URL('../../kiosk/dist', import.meta.url));
app.use('/kiosk', express.static(kioskDirectory));
app.get('/kiosk/{*path}', (_req, res) => res.sendFile(path.join(kioskDirectory, 'index.html')));
app.use("/auth", authRoutes);
app.use("/push-tokens", requireAuth, pushTokensRouter);
app.use("/profile", profileRoutes);
app.use("/schedules", requireAuth, schedulesRouter);
app.use("/medications", medicationRoutes);
app.use("/chat", requireAuth, createChatRouter({ getContext: getChatContext }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Keep API failures readable by mobile and web clients, including invalid JSON.
const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ errors: ['The request contains invalid JSON.'] });
    return;
  }
  if (error.type === 'entity.too.large') {
    res.status(413).json({ errors: ['The request is too large.'] });
    return;
  }
  if (error.code === 'P2002') {
    res.status(409).json({ errors: ['An entry with those details already exists. Choose the existing medicine or use different details.'] });
    return;
  }
  console.error('API request failed:', error.name);
  res.status(500).json({ errors: ['The server could not complete this request. Please try again.'] });
};
app.use(handleError);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startReminderJob();
  void recoverInterruptedOrders().catch((error) => console.error('Vending recovery failed:', error.message));
});
