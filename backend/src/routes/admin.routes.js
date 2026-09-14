import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all admin routes
router.use(requireAuth, requireAdmin);

router.get("/ingestion/status", AdminController.getIngestionStatus);
router.post("/ingestion/run", AdminController.triggerIngestion);
router.get("/stats", AdminController.getStats);

export default router;
