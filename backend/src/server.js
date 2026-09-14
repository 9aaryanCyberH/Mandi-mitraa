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
    }

    // Start background scheduled updates
    if (env.NODE_ENV !== "test") {
      initMandiUpdateJob();
    }

    const server = app.listen(PORT, () => {
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
