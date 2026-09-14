import { prisma } from "../config/database.js";
import { ingestionManager } from "../ingestion/ingestion.service.js";

export class AdminService {
  static async getIngestionStatus() {
    const latest = await ingestionManager.getLatestStatus();
    const history = await ingestionManager.getIngestionHistory(10);
    return { latest, history };
  }

  static async triggerIngestion(options = {}) {
    return ingestionManager.runIngestion({
      ...options,
      triggeredBy: "ADMIN"
    });
  }

  static async getSystemStats() {
    const [states, districts, mandis, commodities, prices, users, lastIngestion] = await Promise.all([
      prisma.state.count(),
      prisma.district.count(),
      prisma.mandi.count(),
      prisma.commodity.count(),
      prisma.marketPrice.count(),
      prisma.user.count(),
      prisma.ingestionLog.findFirst({
        orderBy: { createdAt: "desc" }
      })
    ]);

    return {
      states,
      districts,
      mandis,
      commodities,
      marketPrices: prices,
      users,
      lastIngestion
    };
  }
}
