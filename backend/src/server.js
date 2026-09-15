import app from "./app.js";
import { env } from "./config/env.js";
import { prisma, checkDatabaseConnection } from "./config/database.js";
import { initMandiUpdateJob, stopMandiUpdateJob } from "./jobs/mandi-update.job.js";
import { logger } from "./utils/logger.js";

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    logger.info("Connecting to PostgreSQL database...");
    const isDbConnected = await checkDatabaseConnection();

    if (!isDbConnected) {
      logger.warn("⚠️ Warning: PostgreSQL database is not currently reachable. The server will start, but database operations may fail until connected.");
    } else {
      logger.info("✅ PostgreSQL database connected successfully.");

      // Ensure database schema and all 36 States & UTs with benchmark data are fully initialized
      try {
        const stateCount = await prisma.state.count();
        const priceCount = await prisma.marketPrice.count();
        if (stateCount < 36 || priceCount < 25000) {
          logger.info(`Database has ${stateCount} states and ${priceCount} prices (expected 36 states, 1-year history). Running complete Pan-India seed...`);
          const { seed } = await import("../scripts/seed.js");
          await seed();
          logger.info("✅ Database seeded successfully for all 36 States & UTs with 1-year history.");
        } else {
          logger.info(`✅ Database verified: ${stateCount} States/UTs and ${priceCount} market prices registered.`);
        }
      } catch (tableErr) {
        logger.warn(`⚠️ Application tables missing or uninitialized (${tableErr.message}). Synchronizing schema via Prisma...`);
        try {
          const { execSync } = await import("child_process");
          execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
          const { seed } = await import("../scripts/seed.js");
          await seed();
          logger.info("✅ Database schema synchronized and seeded successfully for all 36 States & UTs.");
        } catch (syncErr) {
          logger.error("❌ Database schema push or seeding failed:", syncErr);
        }
      }
    }

    // Start background scheduled updates
    if (env.NODE_ENV !== "test") {
      initMandiUpdateJob();
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(`🌾 Mandi-Mitra Backend is running on port ${PORT} [${env.NODE_ENV}]`);
      logger.info(`📡 Health check available at: http://localhost:${PORT}/health`);
      logger.info(`🌾 Compatibility endpoints: http://localhost:${PORT}/states`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      stopMandiUpdateJob();

      server.close(async () => {
        logger.info("HTTP server closed.");
        try {
          await prisma.$disconnect();
          logger.info("Database connection closed.");
        } catch (e) {
          logger.error("Error disconnecting Prisma:", e);
        }
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error) {
    logger.error("Fatal error starting Mandi-Mitra server:", error);
    process.exit(1);
  }
}

startServer();
