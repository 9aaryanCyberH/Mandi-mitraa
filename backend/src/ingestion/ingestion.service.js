import { AgmarkService } from "./agmark/agmark.service.js";
import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

class IngestionManager {
  constructor() {
    this.adapters = new Map();
    // Register default AGMARK adapter
    this.registerAdapter("AGMARK", new AgmarkService());
  }

  registerAdapter(name, adapterInstance) {
    this.adapters.set(name.toUpperCase(), adapterInstance);
  }

  getAdapter(name = "AGMARK") {
    const adapter = this.adapters.get(name.toUpperCase());
    if (!adapter) {
      throw new Error(`Ingestion adapter '${name}' not found.`);
    }
    return adapter;
  }

  async runIngestion({ source = "AGMARK", limit = 500, offset = 0, filters = {}, triggeredBy = "MANUAL" } = {}) {
    const adapter = this.getAdapter(source);
    return adapter.runIngestion({ limit, offset, filters, triggeredBy });
  }

  async getLatestStatus() {
    return prisma.ingestionLog.findFirst({
      orderBy: { createdAt: "desc" }
    });
  }

  async getIngestionHistory(limit = 20) {
    return prisma.ingestionLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" }
    });
  }
}

export const ingestionManager = new IngestionManager();
