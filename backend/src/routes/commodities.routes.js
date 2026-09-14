import { Router } from "express";
import { CommoditiesController } from "../controllers/commodities.controller.js";

const router = Router();

router.get("/", CommoditiesController.getAll);
router.get("/:id", CommoditiesController.getById);

export default router;
