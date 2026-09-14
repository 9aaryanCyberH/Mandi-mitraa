import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

export class AgmarkClient {
  constructor(apiKey = env.AGMARK_API_KEY, baseUrl = env.AGMARK_BASE_URL, resourceId = env.AGMARK_RESOURCE_ID) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.resourceId = resourceId;
  }

  /**
   * Fetches records from the official data.gov.in AGMARK daily mandi price resource.
   * @param {Object} options - query options
   * @param {number} options.limit - number of records per page
   * @param {number} options.offset - page offset
   * @param {Object} [options.filters] - optional filters e.g. { state: 'Punjab' }
   * @returns {Promise<{ records: Array, total: number, count: number }>}
   */
  async fetchDailyPrices({ limit = 500, offset = 0, filters = {} } = {}) {
    if (!this.apiKey) {
      logger.warn("AGMARK_API_KEY is not configured in environment. Ingestion client will return empty records or fallback.");
      return { records: [], total: 0, count: 0 };
    }

    const cleanResourceId = String(this.resourceId).replace(/^\/?(resource\/)?/, "");
    const cleanBaseUrl = String(this.baseUrl).replace(/\/+$/, "");
    const url = new URL(`${cleanBaseUrl}/${cleanResourceId}`);
    url.searchParams.set("api-key", this.apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("offset", offset.toString());

    // Apply any filters (lowercase keys for data.gov.in compatibility)
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        url.searchParams.set(`filters[${key.toLowerCase()}]`, value);
      }
    }

    logger.info(`Fetching AGMARK data from official API (offset: ${offset}, limit: ${limit})...`);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mandi-Mitra-AGMARK-Ingestor/1.0"
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`AGMARK API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`AGMARK API returned error: ${data.error}`);
    }

    return {
      records: data.records || [],
      total: Number(data.total) || (data.records ? data.records.length : 0),
      count: Number(data.count) || (data.records ? data.records.length : 0)
    };
  }
}
