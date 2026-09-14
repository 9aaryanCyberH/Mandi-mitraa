import { Router } from "express";
import { LegacyController } from "../controllers/legacy.controller.js";

const router = Router();

// Exact frontend legacy endpoints
router.get("/states", LegacyController.getStates);
router.get("/commodities", LegacyController.getCommodities);
router.post("/getdata", LegacyController.getData);
router.get("/getdata", LegacyController.getData);

export default router;
