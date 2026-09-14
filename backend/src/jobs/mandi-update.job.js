import cron from "node-cron";
import { env } from "../config/env.js";
import { ingestionManager } from "../ingestion/ingestion.service.js";
import { logger } from "../utils/logger.js";

let scheduledTask = null;

export function initMandiUpdateJob() {
  const cronExpression = env.SCRAPER_CRON;

  if (!cron.validate(cronExpression)) {
    logger.error(`Invalid cron expression for SCRAPER_CRON: "${cronExpression}". Ingestion job not started.`);
    return;
  }

  logger.info(`Initializing AGMARK automated ingestion job with schedule: "${cronExpression}"`);

  // Run initial automated sync in the background shortly after startup
  setTimeout(async () => {
    logger.info("Executing initial startup AGMARK real-time data sync...");
    try {
      const result = await ingestionManager.runIngestion({
        source: "AGMARK",
        limit: 500,
        triggeredBy: "STARTUP_AUTO_SYNC"
      });
      logger.info("Startup AGMARK real-time data sync completed successfully:", result);
    } catch (err) {
      logger.warn("Startup AGMARK real-time data sync notice:", err.message);
    }
  }, 5000);

  scheduledTask = cron.schedule(cronExpression, async () => {
    logger.info("Executing scheduled AGMARK market data update job...");
    try {
      const result = await ingestionManager.runIngestion({
        source: "AGMARK",
        limit: 1000,
        triggeredBy: "CRON"
      });
      logger.info("Scheduled AGMARK data update completed successfully:", result);
    } catch (err) {
      logger.error("Scheduled AGMARK data update encountered an error:", err.message);
    }
  });

  return scheduledTask;
}

export function stopMandiUpdateJob() {
  if (scheduledTask) {
    scheduledTask.stop();
    logger.info("AGMARK scheduled update job stopped.");
  }
}
