import express from "express";
import authRoutes from "../routes/auth"
import schedulesRouter from "../routes/schedules"
import { requireAuth } from 

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/schedules", schedulesRouter);
app.use("/schedules", requireAuth, schedulesRouter)

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => console.log("Server running on port 3000"));