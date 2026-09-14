import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";

export class MandiService {
  /**
   * Returns list of mandis with optional filtering by state, district, or search keyword
   */
  static async getMandis({ state, stateId, district, districtId, search, page = 1, limit = 50 }) {
    const where = {};

    if (stateId) {
      where.stateId = stateId;
    } else if (state) {
      where.state = {
        name: { equals: state, mode: "insensitive" }
      };
    }

    if (districtId) {
      where.districtId = districtId;
    } else if (district) {
      where.district = {
        name: { equals: district, mode: "insensitive" }
      };
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const skip = (page - 1) * limit;

    const [mandis, total] = await Promise.all([
      prisma.mandi.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          state: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
          _count: {
            select: { marketPrices: true }
          }
        }
      }),
      prisma.mandi.count({ where })
    ]);

    return {
      mandis,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Returns mandi by ID with recent prices
   */
  static async getMandiById(id) {
    const mandiId = parseInt(id, 10);
    const mandi = await prisma.mandi.findUnique({
      where: { id: mandiId },
      include: {
        state: true,
        district: true,
        marketPrices: {
          take: 10,
          orderBy: { arrivalDate: "desc" },
          include: {
            commodity: true
          }
        }
      }
    });

    if (!mandi) {
      throw new NotFoundError(`Mandi with ID ${id} not found`);
    }

    return mandi;
  }
}
