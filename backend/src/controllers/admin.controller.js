import { AdminService } from "../services/admin.service.js";
import { successResponse } from "../utils/response.js";

export class AdminController {
  static async getIngestionStatus(req, res, next) {
    try {
      const status = await AdminService.getIngestionStatus();
      return successResponse(res, status);
    } catch (error) {
      next(error);
    }
  }

  static async triggerIngestion(req, res, next) {
    try {
      const { limit, offset, filters } = req.body || {};
      const result = await AdminService.triggerIngestion({ limit, offset, filters });
      return successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await AdminService.getSystemStats();
      return successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  }
}
