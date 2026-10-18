import { Router } from "express";
import { listMedications, getMedication } from "../controllers/medicationController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, listMedications);
router.get("/:id", requireAuth, getMedication);

export default router;