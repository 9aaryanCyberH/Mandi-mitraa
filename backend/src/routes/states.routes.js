import { Router } from "express";
import { StatesController } from "../controllers/states.controller.js";

const router = Router();

router.get("/", StatesController.getAll);
router.get("/:stateId", StatesController.getById);

export default router;
