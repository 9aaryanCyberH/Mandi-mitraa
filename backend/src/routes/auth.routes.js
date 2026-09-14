import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema, "body"), AuthController.register);
router.post("/login", validate(loginSchema, "body"), AuthController.login);
router.get("/me", requireAuth, AuthController.me);

export default router;
