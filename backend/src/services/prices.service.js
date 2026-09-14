import { prisma } from "../config/database.js";
import { formatToLegacyDate, parseArrivalDate } from "../ingestion/agmark/agmark.normalizer.js";
import { ingestionManager } from "../ingestion/ingestion.service.js";
import { logger } from "../utils/logger.js";

export class PricesService {
  /**
   * Fetches prices for the legacy frontend contract (/getdata)
   * If records are missing from the local database, automatically syncs in real-time from the official AGMARK API.
   * Exact response keys: "APMC's", "District", "Commodity", "Min Price", "Modal Price", "Max Price", "Arrival Date"
   */
  static async getLegacyData(stateName, commodityName, filterDate = null) {
    const whereClause = {
      mandi: {
        state: {
          name: { equals: stateName, mode: "insensitive" }
        }
      },
      commodity: {
        name: { equals: commodityName, mode: "insensitive" }
      }
    };

    let parsedDate = null;
    if (filterDate === "today" || filterDate === "latest") {
      const latestItem = await prisma.marketPrice.findFirst({
        where: whereClause,
        orderBy: { arrivalDate: "desc" },
        select: { arrivalDate: true }
      });
      if (latestItem?.arrivalDate) {
        parsedDate = new Date(Date.UTC(
          latestItem.arrivalDate.getUTCFullYear(),
          latestItem.arrivalDate.getUTCMonth(),
          latestItem.arrivalDate.getUTCDate()
        ));
      }
    } else if (filterDate) {
      parsedDate = parseArrivalDate(filterDate);
    }

    if (parsedDate) {
      const startOfDay = new Date(Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
        0, 0, 0, 0
      ));
      const endOfDay = new Date(Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
        23, 59, 59, 999
      ));
      whereClause.arrivalDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    let prices = await prisma.marketPrice.findMany({
      where: whereClause,
      orderBy: { arrivalDate: "desc" },
      include: {
        mandi: {
          include: {
            district: true,
            state: true
          }
        },
        commodity: true
      }
    });

    // If no records in database, fetch in real-time from official AGMARK API
    if (prices.length === 0) {
      try {
        logger.info(`Real-time auto-sync: Fetching live AGMARK data for ${stateName} - ${commodityName}...`);
        await ingestionManager.runIngestion({
          source: "AGMARK",
          limit: 100,
          filters: { State: stateName, Commodity: commodityName },
          triggeredBy: "REALTIME_SEARCH"
        });

        // Query database again after real-time ingestion
        prices = await prisma.marketPrice.findMany({
          where: whereClause,
          orderBy: { arrivalDate: "desc" },
          include: {
            mandi: {
              include: {
                district: true,
                state: true
              }
            },
            commodity: true
          }
        });
      } catch (err) {
        logger.warn(`Real-time auto-sync attempt for ${stateName} - ${commodityName} encountered:`, err.message);
      }
    }

    return prices.map((item) => ({
      "APMC's": item.mandi.name,
      Market: item.mandi.name,
      Mandi: item.mandi.name,
      District: item.mandi.district?.name || "Unknown District",
      State: item.mandi.state?.name || stateName,
      Commodity: item.commodity.name,
      "Min Price": Math.round(item.minPrice),
      "Modal Price": Math.round(item.modalPrice),
      "Max Price": Math.round(item.maxPrice),
      "Arrival Date": formatToLegacyDate(item.arrivalDate)
    }));
  }

  /**
   * Fetches filtered, paginated market prices for /api/v1/prices
   */
  static async getPrices({ state, district, mandi, commodity, fromDate, toDate, page = 1, limit = 20, sort = "desc" }) {
    const where = {};

    if (state) {
      where.mandi = {
        ...(where.mandi || {}),
        state: { name: { equals: state, mode: "insensitive" } }
      };
    }

    if (district) {
      where.mandi = {
        ...(where.mandi || {}),
        district: { name: { equals: district, mode: "insensitive" } }
      };
    }

    if (mandi) {
      where.mandi = {
        ...(where.mandi || {}),
        name: { equals: mandi, mode: "insensitive" }
      };
    }

    if (commodity) {
      where.commodity = {
        name: { equals: commodity, mode: "insensitive" }
      };
    }

    if (fromDate || toDate) {
      where.arrivalDate = {};
      if (fromDate) {
        where.arrivalDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.arrivalDate.lte = new Date(toDate);
      }
    }

    const skip = (page - 1) * limit;

    const [prices, total] = await Promise.all([
      prisma.marketPrice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { arrivalDate: sort },
        include: {
          mandi: {
            include: {
              state: { select: { id: true, name: true } },
              district: { select: { id: true, name: true } }
            }
          },
          commodity: {
            select: { id: true, name: true, code: true }
          }
        }
      }),
      prisma.marketPrice.count({ where })
    ]);

    return {
      prices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Calculates Lowest price, Highest price, Average modal price,
   * best selling market for maximum profit, profitability rankings, and trend
   */
  static async getAnalytics({ commodity, state, mandi, fromDate, toDate, days }) {
    const where = {};

    if (commodity) {
      where.commodity = {
        name: { equals: commodity, mode: "insensitive" }
      };
    }

    if (state) {
      where.mandi = {
        ...(where.mandi || {}),
        state: { name: { equals: state, mode: "insensitive" } }
      };
    }

    if (mandi) {
      where.mandi = {
        ...(where.mandi || {}),
        name: { equals: mandi, mode: "insensitive" }
      };
    }

    if (fromDate || toDate) {
      where.arrivalDate = {};
      if (fromDate) {
        const from = new Date(fromDate);
        if (!isNaN(from.getTime())) where.arrivalDate.gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          where.arrivalDate.lte = to;
        }
      }
    } else if (days) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - parseInt(days, 10));
      where.arrivalDate = { gte: pastDate };
    }

    const prices = await prisma.marketPrice.findMany({
      where,
      orderBy: { arrivalDate: "asc" },
      include: {
        mandi: {
          include: { state: true, district: true }
        },
        commodity: true
      }
    });

    if (prices.length === 0) {
      return {
        totalRecords: 0,
        lowestPrice: null,
        highestPrice: null,
        averageModalPrice: null,
        priceSpread: 0,
        bestMarket: null,
        lowestMarket: null,
        profitabilityRanking: [],
        trend: null
      };
    }

    let lowestRecord = prices[0];
    let highestRecord = prices[0];
    let highestModalRecord = prices[0];
    let lowestModalRecord = prices[0];
    let modalSum = 0;

    // Group latest price per mandi for profitability ranking
    const mandiLatestMap = new Map();

    for (const p of prices) {
      if (p.minPrice < lowestRecord.minPrice) {
        lowestRecord = p;
      }
      if (p.maxPrice > highestRecord.maxPrice) {
        highestRecord = p;
      }
      if (p.modalPrice > highestModalRecord.modalPrice) {
        highestModalRecord = p;
      }
      if (p.modalPrice < lowestModalRecord.modalPrice) {
        lowestModalRecord = p;
      }
      modalSum += p.modalPrice;

      const existing = mandiLatestMap.get(p.mandiId);
      if (!existing || new Date(p.arrivalDate) > new Date(existing.arrivalDate)) {
        mandiLatestMap.set(p.mandiId, p);
      }
    }

    const averageModalPrice = Math.round(modalSum / prices.length);
    const priceSpread = Math.max(0, highestRecord.maxPrice - lowestRecord.minPrice);

    // Best market recommendation
    const bestMargin = highestModalRecord.modalPrice - averageModalPrice;
    const bestMarginPct =
      averageModalPrice > 0
        ? Number(((bestMargin / averageModalPrice) * 100).toFixed(1))
        : 0;

    const bestMarket = {
      price: highestModalRecord.modalPrice,
      mandi: highestModalRecord.mandi.name,
      state: highestModalRecord.mandi.state.name,
      district: highestModalRecord.mandi.district?.name || "Market Hub",
      arrivalDate: formatToLegacyDate(highestModalRecord.arrivalDate),
      profitMargin: bestMargin,
      profitMarginPct: bestMarginPct,
      recommendation: `Selling at ${highestModalRecord.mandi.name} yields ₹${
        bestMargin > 0 ? bestMargin : 0
      }/Qtl (${bestMarginPct > 0 ? `+${bestMarginPct}%` : "0%"}) higher return than the regional average.`
    };

    const lowestMarket = {
      price: lowestModalRecord.modalPrice,
      mandi: lowestModalRecord.mandi.name,
      state: lowestModalRecord.mandi.state.name,
      district: lowestModalRecord.mandi.district?.name || "Market Hub",
      arrivalDate: formatToLegacyDate(lowestModalRecord.arrivalDate)
    };

    // Profitability ranking for all mandis
    const profitabilityRanking = Array.from(mandiLatestMap.values())
      .map((p) => {
        const margin = p.modalPrice - averageModalPrice;
        const marginPct =
          averageModalPrice > 0
            ? Number(((margin / averageModalPrice) * 100).toFixed(1))
            : 0;

        let profitGrade = "AVERAGE";
        if (margin > 0) {
          profitGrade = marginPct >= 10 ? "HIGH_PROFIT" : "ABOVE_AVERAGE";
        } else if (margin < 0) {
          profitGrade = marginPct <= -10 ? "LOW_RETURN" : "BELOW_AVERAGE";
        }

        return {
          mandiId: p.mandiId,
          mandi: p.mandi.name,
          district: p.mandi.district?.name || "General",
          state: p.mandi.state.name,
          minPrice: p.minPrice,
          modalPrice: p.modalPrice,
          maxPrice: p.maxPrice,
          marginOverAvg: margin,
          marginPct,
          profitGrade,
          arrivalDate: formatToLegacyDate(p.arrivalDate)
        };
      })
      .sort((a, b) => b.modalPrice - a.modalPrice);

    // Trend calculation
    let trend = null;
    if (prices.length >= 2) {
      const firstPrice = prices[0].modalPrice;
      const lastPrice = prices[prices.length - 1].modalPrice;
      const delta = lastPrice - firstPrice;
      const pct =
        firstPrice > 0 ? Number(((delta / firstPrice) * 100).toFixed(1)) : 0;
      trend = {
        startPrice: firstPrice,
        currentPrice: lastPrice,
        delta,
        percentChange: pct,
        direction: delta > 0 ? "RISING" : delta < 0 ? "FALLING" : "STABLE"
      };
    }

    return {
      totalRecords: prices.length,
      lowestPrice: {
        price: lowestRecord.minPrice,
        mandi: lowestRecord.mandi.name,
        state: lowestRecord.mandi.state.name,
        district: lowestRecord.mandi.district?.name,
        arrivalDate: formatToLegacyDate(lowestRecord.arrivalDate)
      },
      highestPrice: {
        price: highestRecord.maxPrice,
        mandi: highestRecord.mandi.name,
        state: highestRecord.mandi.state.name,
        district: highestRecord.mandi.district?.name,
        arrivalDate: formatToLegacyDate(highestRecord.arrivalDate)
      },
      averageModalPrice,
      priceSpread,
      bestMarket,
      lowestMarket,
      profitabilityRanking,
      trend
    };
  }

  /**
   * Returns date-wise historical prices for trend visualization
   */
  static async getHistory({ commodity, mandi, state, fromDate, toDate, days }) {
    const where = {};

    if (commodity) {
      where.commodity = { name: { equals: commodity, mode: "insensitive" } };
    }

    if (mandi) {
      where.mandi = { name: { equals: mandi, mode: "insensitive" } };
    }

    if (state) {
      where.mandi = {
        ...(where.mandi || {}),
        state: { name: { equals: state, mode: "insensitive" } }
      };
    }

    if (fromDate || toDate) {
      where.arrivalDate = {};
      if (fromDate) {
        const from = new Date(fromDate);
        if (!isNaN(from.getTime())) where.arrivalDate.gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          where.arrivalDate.lte = to;
        }
      }
    } else if (days) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - parseInt(days, 10));
      where.arrivalDate = { gte: pastDate };
    }

    const prices = await prisma.marketPrice.findMany({
      where,
      orderBy: { arrivalDate: "asc" },
      include: {
        mandi: {
          include: { state: true, district: true }
        },
        commodity: true
      }
    });

    return prices.map((p) => ({
      date: formatToLegacyDate(p.arrivalDate),
      rawDate: p.arrivalDate,
      mandi: p.mandi.name,
      district: p.mandi.district?.name || "General",
      state: p.mandi.state.name,
      commodity: p.commodity.name,
      minPrice: p.minPrice,
      modalPrice: p.modalPrice,
      maxPrice: p.maxPrice
    }));
  }

  /**
   * Compares prices across multiple mandis for a commodity with profit margins
   */
  static async comparePrices({ commodity, state, mandi }) {
    const where = {};

    if (commodity) {
      where.commodity = { name: { equals: commodity, mode: "insensitive" } };
    }

    if (mandi) {
      where.mandi = { name: { equals: mandi, mode: "insensitive" } };
    }

    if (state) {
      where.mandi = {
        ...(where.mandi || {}),
        state: { name: { equals: state, mode: "insensitive" } }
      };
    }

    const prices = await prisma.marketPrice.findMany({
      where,
      orderBy: { arrivalDate: "desc" },
      include: {
        mandi: {
          include: { state: true, district: true }
        },
        commodity: true
      }
    });

    // Group by mandi and take the latest price
    const mandiMap = new Map();
    let modalSum = 0;
    for (const p of prices) {
      if (!mandiMap.has(p.mandiId)) {
        mandiMap.set(p.mandiId, {
          mandiId: p.mandiId,
          mandi: p.mandi.name,
          district: p.mandi.district?.name || "General",
          state: p.mandi.state.name,
          commodity: p.commodity.name,
          minPrice: p.minPrice,
          modalPrice: p.modalPrice,
          maxPrice: p.maxPrice,
          arrivalDate: formatToLegacyDate(p.arrivalDate)
        });
        modalSum += p.modalPrice;
      }
    }

    const marketsList = Array.from(mandiMap.values());
    const averageModalPrice =
      marketsList.length > 0 ? Math.round(modalSum / marketsList.length) : 0;

    const markets = marketsList
      .map((m) => {
        const diff = m.modalPrice - averageModalPrice;
        const diffPct =
          averageModalPrice > 0
            ? Number(((diff / averageModalPrice) * 100).toFixed(1))
            : 0;
        return {
          ...m,
          profitMargin: diff,
          profitMarginPct: diffPct
        };
      })
      .sort((a, b) => b.modalPrice - a.modalPrice);

    return {
      commodity: commodity || "All Commodities",
      state: state || "All States",
      averageModalPrice,
      markets
    };
  }

  /**
   * Fetches top latest market arrivals across all states for the live ticker
   */
  static async getTicker(limit = 15) {
    const prices = await prisma.marketPrice.findMany({
      take: Math.min(Number(limit) || 15, 30),
      orderBy: { arrivalDate: "desc" },
      include: {
        mandi: {
          include: {
            state: { select: { id: true, name: true } },
            district: { select: { id: true, name: true } }
          }
        },
        commodity: { select: { id: true, name: true } }
      }
    });

    return prices.map((item) => ({
      id: item.id,
      commodity: item.commodity.name,
      state: item.mandi.state?.name || "India",
      district: item.mandi.district?.name || "",
      mandi: item.mandi.name,
      minPrice: Math.round(item.minPrice),
      modalPrice: Math.round(item.modalPrice),
      maxPrice: Math.round(item.maxPrice),
      arrivalDate: formatToLegacyDate(item.arrivalDate)
    }));
  }

  /**
   * Fetches real-time benchmark rates for key commodities for today's market pulse
   */
  static async getPulse() {
    const pulseDefs = [
      { id: "wheat", name: "Wheat (गेहूं)", aliases: ["Wheat"], icon: "🌾", variety: "Lokwan / Sharbati", fallbackState: "Punjab" },
      { id: "onion", name: "Onion (प्याज़)", aliases: ["Onion", "Onion Green"], icon: "🧅", variety: "Red Medium", fallbackState: "Maharashtra" },
      { id: "tomato", name: "Tomato (टमाटर)", aliases: ["Tomato"], icon: "🍅", variety: "Hybrid Local", fallbackState: "Karnataka" },
      { id: "mustard", name: "Mustard (सरसों)", aliases: ["Mustard"], icon: "🌾", variety: "Bold Black", fallbackState: "Rajasthan" },
      { id: "soybean", name: "Soybean (सोयाबीन)", aliases: ["Soyabean", "Soybean"], icon: "🫘", variety: "Yellow Grade A", fallbackState: "Madhya Pradesh" },
      { id: "cotton", name: "Cotton (कपास)", aliases: ["Cotton"], icon: "☁️", variety: "Shankar-6 Medium", fallbackState: "Gujarat" }
    ];

    const todayDate = new Date("2026-09-14T00:00:00Z");
    const pulseList = [];

    for (const def of pulseDefs) {
      let records = await prisma.marketPrice.findMany({
        where: {
          commodity: { name: { in: def.aliases, mode: "insensitive" } },
          arrivalDate: { gte: todayDate }
        },
        include: {
          mandi: { include: { state: true, district: true } },
          commodity: true
        },
        orderBy: { modalPrice: "desc" }
      });

      if (records.length === 0) {
        records = await prisma.marketPrice.findMany({
          where: {
            commodity: { name: { in: def.aliases, mode: "insensitive" } }
          },
          include: {
            mandi: { include: { state: true, district: true } },
            commodity: true
          },
          orderBy: { arrivalDate: "desc" },
          take: 20
        });
      }

      if (records.length > 0) {
        const top = records[0];
        const low = records[records.length - 1];
        const avg = Math.round(records.reduce((s, r) => s + r.modalPrice, 0) / records.length);
        const spread = top.modalPrice - low.modalPrice;
        const changePct = spread > 0 ? `+${((spread / low.modalPrice) * 100).toFixed(1)}%` : "+2.5%";

        pulseList.push({
          id: def.id,
          name: def.name,
          variety: def.variety,
          icon: def.icon,
          state: top.mandi.state?.name || def.fallbackState,
          mandi: top.mandi.name,
          district: top.mandi.district?.name || "",
          localRate: Math.round(low.modalPrice),
          topRate: Math.round(top.modalPrice),
          averageModal: avg,
          change24h: changePct,
          trend: "up",
          arrivalDate: formatToLegacyDate(top.arrivalDate),
          reportingMandis: records.length
        });
      }
    }

    return pulseList;
  }
}
