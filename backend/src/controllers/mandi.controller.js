import { MandiService } from "../services/mandi.service.js";
import { successResponse } from "../utils/response.js";

export class MandiController {
  static async getAll(req, res, next) {
    try {
      const result = await MandiService.getMandis(req.query);
      return successResponse(res, result.mandis, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const mandi = await MandiService.getMandiById(req.params.id);
      return successResponse(res, mandi);
    } catch (error) {
      next(error);
    }
  }
}
