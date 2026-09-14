import { Router } from "express";
import { MandiController } from "../controllers/mandi.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { getMandisQuerySchema } from "../validators/mandi.validator.js";

const router = Router();

router.get("/", validate(getMandisQuerySchema, "query"), MandiController.getAll);
router.get("/:id", MandiController.getById);

export default router;
