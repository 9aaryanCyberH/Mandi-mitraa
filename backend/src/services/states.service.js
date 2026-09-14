import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";

export class StatesService {
  /**
   * Returns list of all state names alphabetically sorted for frontend compatibility
   */
  static async getAllStateNames() {
    const states = await prisma.state.findMany({
      select: { name: true },
      orderBy: { name: "asc" }
    });
    return states.map((s) => s.name);
  }

  /**
   * Returns all states with relation counts for v1 API
   */
  static async getAllStates() {
    return prisma.state.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            districts: true,
            mandis: true
          }
        }
      }
    });
  }

  /**
   * Returns single state by ID
   */
  static async getStateById(id) {
    const stateId = parseInt(id, 10);
    const state = await prisma.state.findUnique({
      where: { id: stateId },
      include: {
        districts: {
          orderBy: { name: "asc" }
        },
        mandis: {
          orderBy: { name: "asc" }
        }
      }
    });

    if (!state) {
      throw new NotFoundError(`State with ID ${id} not found`);
    }

    return state;
  }
}
