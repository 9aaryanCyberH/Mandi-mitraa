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

// Root API Welcome & Endpoint Directory
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    name: "Mandi-Mitra API",
    version: "1.0.0",
    status: "online",
    description:
      "Official AGMARK agricultural market intelligence and real-time price discovery API for India.",
    endpoints: {
      health: "/health",
      states: "/states",
      commodities: "/commodities?state={state}",
      price_discovery: "POST /getdata",
      api_v1: {
        prices: "/api/v1/prices",
        analytics: "/api/v1/prices/analytics?state={state}&commodity={commodity}",
        history: "/api/v1/prices/history?state={state}&commodity={commodity}&days={days}",
        compare: "/api/v1/prices/compare?state={state}&commodity={commodity}",
        states: "/api/v1/states",
        commodities: "/api/v1/commodities",
        mandis: "/api/v1/mandis"
      }
    },
    documentation: "https://github.com/9aaryanCyberH/Mandi-mitraa"
  });
});

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

// Manual/On-demand Pan-India Seed Trigger
router.get("/seed", async (req, res) => {
  try {
    const { seed } = await import("../../scripts/seed.js");
    await seed();
    const { prisma } = await import("../config/database.js");
    const states = await prisma.state.count();
    const prices = await prisma.marketPrice.count();
    return res.status(200).json({
      success: true,
      message: "Pan-India database seeded successfully for all 36 States & UTs",
      states,
      prices
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
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
