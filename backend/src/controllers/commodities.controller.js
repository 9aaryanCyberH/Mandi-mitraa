import { CommoditiesService } from "../services/commodities.service.js";
import { successResponse } from "../utils/response.js";

export class CommoditiesController {
  static async getAll(req, res, next) {
    try {
      const commodities = await CommoditiesService.getAllCommodities();
      return successResponse(res, commodities);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const commodity = await CommoditiesService.getCommodityById(req.params.id);
      return successResponse(res, commodity);
    } catch (error) {
      next(error);
    }
  }
}
