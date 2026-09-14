import { Router } from "express";
import legacyRoutes from "./legacy.routes.js";
import statesRoutes from "./states.routes.js";
import commoditiesRoutes from "./commodities.routes.js";
import mandiRoutes from "./mandi.routes.js";
import pricesRoutes from "./prices.routes.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import { checkDatabaseConnection } from "../config/database.js";

const router = Router();

// Health Check Endpoint (Section 21)
router.get("/health", async (req, res) => {
  const isDbConnected = await checkDatabaseConnection();
  const statusCode = isDbConnected ? 200 : 503;

  return res.status(statusCode).json({
    status: isDbConnected ? "ok" : "degraded",
    database: isDbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Legacy frontend compatibility endpoints at root level
router.use("/", legacyRoutes);

// Versioned REST API endpoints under /api/v1
const v1Router = Router();
v1Router.use("/states", statesRoutes);
v1Router.use("/commodities", commoditiesRoutes);
v1Router.use("/mandis", mandiRoutes);
v1Router.use("/prices", pricesRoutes);
v1Router.use("/auth", authRoutes);
v1Router.use("/admin", adminRoutes);

router.use("/api/v1", v1Router);

export default router;
