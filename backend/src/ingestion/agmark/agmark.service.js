import { AgmarkClient } from "./agmark.client.js";
import { parseAgmarkRecord } from "./agmark.parser.js";
import { normalizeAgmarkRecord } from "./agmark.normalizer.js";
import { prisma } from "../../config/database.js";
import { logger } from "../../utils/logger.js";

export class AgmarkService {
  constructor(client = new AgmarkClient()) {
    this.client = client;
  }

  /**
   * Runs an ingestion batch from AGMARK data source
   * @param {Object} options
   * @param {number} options.limit - records to fetch
   * @param {number} options.offset - pagination offset
   * @param {Object} options.filters - filters for API
   * @param {string} options.triggeredBy - "CRON" | "MANUAL" | "ADMIN"
   */
  async runIngestion({ limit = 500, offset = 0, filters = {}, triggeredBy = "MANUAL" } = {}) {
    const startTime = Date.now();
    logger.info(`Starting AGMARK data ingestion (Triggered by: ${triggeredBy})...`);

    let logEntry;
    try {
      logEntry = await prisma.ingestionLog.create({
        data: {
          source: "AGMARK",
          status: "RUNNING",
          triggeredBy
        }
      });
    } catch (e) {
      logger.warn("Could not create initial ingestion log entry in database:", e.message);
    }

    let recordsFetched = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsRejected = 0;

    try {
      const response = await this.client.fetchDailyPrices({ limit, offset, filters });
      const rawRecords = response.records || [];
      recordsFetched = rawRecords.length;

      logger.info(`Fetched ${recordsFetched} raw records from AGMARK data source.`);

      // State and commodity cache to minimize duplicate lookups
      const stateCache = new Map();
      const districtCache = new Map();
      const mandiCache = new Map();
      const commodityCache = new Map();

      for (const raw of rawRecords) {
        const parsed = parseAgmarkRecord(raw);
        const normalized = normalizeAgmarkRecord(parsed);

        if (!normalized.valid) {
          recordsRejected++;
          continue;
        }

        const item = normalized.data;

        try {
          // 1. Get or create State
          let stateId = stateCache.get(item.stateName);
          if (!stateId) {
            const state = await prisma.state.upsert({
              where: { name: item.stateName },
              create: { name: item.stateName },
              update: {}
            });
            stateId = state.id;
            stateCache.set(item.stateName, stateId);
          }

          // 2. Get or create District
          const districtKey = `${item.districtName}_${stateId}`;
          let districtId = districtCache.get(districtKey);
          if (!districtId) {
            const district = await prisma.district.upsert({
              where: {
                name_stateId: {
                  name: item.districtName,
                  stateId
                }
              },
              create: {
                name: item.districtName,
                stateId
              },
              update: {}
            });
            districtId = district.id;
            districtCache.set(districtKey, districtId);
          }

          // 3. Get or create Mandi
          const mandiKey = `${item.mandiName}_${stateId}_${districtId}`;
          let mandiId = mandiCache.get(mandiKey);
          if (!mandiId) {
            const mandi = await prisma.mandi.upsert({
              where: {
                name_stateId_districtId: {
                  name: item.mandiName,
                  stateId,
                  districtId
                }
              },
              create: {
                name: item.mandiName,
                stateId,
                districtId
              },
              update: {}
            });
            mandiId = mandi.id;
            mandiCache.set(mandiKey, mandiId);
          }

          // 4. Get or create Commodity
          let commodityId = commodityCache.get(item.commodityName);
          if (!commodityId) {
            const commodity = await prisma.commodity.upsert({
              where: { name: item.commodityName },
              create: {
                name: item.commodityName,
                code: item.commodityCode
              },
              update: {
                code: item.commodityCode || undefined
              }
            });
            commodityId = commodity.id;
            commodityCache.set(item.commodityName, commodityId);
          }

          // 5. Upsert MarketPrice
          const existingPrice = await prisma.marketPrice.findUnique({
            where: {
              mandiId_commodityId_arrivalDate: {
                mandiId,
                commodityId,
                arrivalDate: item.arrivalDate
              }
            }
          });

          if (existingPrice) {
            await prisma.marketPrice.update({
              where: { id: existingPrice.id },
              data: {
                minPrice: item.minPrice,
                modalPrice: item.modalPrice,
                maxPrice: item.maxPrice,
                variety: item.variety || existingPrice.variety,
                grade: item.grade || existingPrice.grade,
                unit: item.unit
              }
            });
            recordsUpdated++;
          } else {
            await prisma.marketPrice.create({
              data: {
                mandiId,
                commodityId,
                arrivalDate: item.arrivalDate,
                minPrice: item.minPrice,
                modalPrice: item.modalPrice,
                maxPrice: item.maxPrice,
                variety: item.variety,
                grade: item.grade,
                unit: item.unit,
                source: item.source
              }
            });
            recordsInserted++;
          }
        } catch (itemError) {
          logger.warn(`Failed to persist record for ${item.mandiName} - ${item.commodityName}:`, itemError.message);
          recordsRejected++;
        }
      }

      const durationMs = Date.now() - startTime;
      const stats = {
        status: "SUCCESS",
        recordsFetched,
        recordsInserted,
        recordsUpdated,
        recordsRejected,
        durationMs
      };

      if (logEntry) {
        await prisma.ingestionLog.update({
          where: { id: logEntry.id },
          data: stats
        });
      }

      logger.info("AGMARK ingestion completed successfully:", stats);
      return stats;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const failedStats = {
        status: "FAILED",
        recordsFetched,
        recordsInserted,
        recordsUpdated,
        recordsRejected,
        durationMs,
        error: err.message
      };

      if (logEntry) {
        await prisma.ingestionLog.update({
          where: { id: logEntry.id },
          data: failedStats
        });
      }

      logger.error("AGMARK ingestion job failed:", err);
      throw err;
    }
  }
}
