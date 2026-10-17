import express from "express";
import authRoutes from "../routes/auth";
import profileRoutes from "../routes/profile"
import schedulesRouter from "../routes/schedules";
import { requireAuth } from "../middleware/auth.js";
import { createChatRouter } from "../routes/chat";
import { getChatContext } from "./services/chatContext";

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
app.use("/profile", profileRoutes);
app.use("/schedules", requireAuth, schedulesRouter);
app.use("/chat", requireAuth, createChatRouter({ getContext: getChatContext }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
