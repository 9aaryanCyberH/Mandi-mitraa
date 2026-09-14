import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";

export class CommoditiesService {
  /**
   * Returns list of commodity names available in a particular state
   * Queries distinct commodities that have active mandis or market prices in the state
   */
  static async getCommoditiesByState(stateName) {
    // 1. Fetch all commodities across the platform
    const allCommodities = await prisma.commodity.findMany({
      select: { name: true },
      orderBy: { name: "asc" }
    });
    const allNames = allCommodities.map((c) => c.name);

    if (!stateName || typeof stateName !== "string" || !stateName.trim()) {
      return allNames;
    }

    // 2. Query commodities that have recorded prices for mandis in this state
    const state = await prisma.state.findFirst({
      where: {
        name: { equals: stateName.trim(), mode: "insensitive" }
      }
    });

    if (!state) {
      return allNames;
    }

    const grouped = await prisma.marketPrice.groupBy({
      by: ["commodityId"],
      where: {
        mandi: {
          stateId: state.id
        }
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } }
    });

    const cIds = grouped.map((g) => g.commodityId);
    const stateComms = await prisma.commodity.findMany({
      where: { id: { in: cIds } },
      select: { id: true, name: true }
    });
    const commMap = new Map(stateComms.map((c) => [c.id, c.name]));
    const stateCommodityNames = cIds
      .map((id) => commMap.get(id))
      .filter(Boolean);

    const otherCommodities = allNames
      .filter((name) => !stateCommodityNames.includes(name))
      .sort((a, b) => a.localeCompare(b));

    return [...stateCommodityNames, ...otherCommodities];
  }

  /**
   * Returns all commodities with price counts for v1 API
   */
  static async getAllCommodities() {
    return prisma.commodity.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            marketPrices: true
          }
        }
      }
    });
  }

  /**
   * Returns single commodity by ID
   */
  static async getCommodityById(id) {
    const commodityId = parseInt(id, 10);
    const commodity = await prisma.commodity.findUnique({
      where: { id: commodityId }
    });

    if (!commodity) {
      throw new NotFoundError(`Commodity with ID ${id} not found`);
    }

    return commodity;
  }
}
