import { PricesService } from "../services/prices.service.js";
import { successResponse } from "../utils/response.js";

export class PricesController {
  static async getAll(req, res, next) {
    try {
      const result = await PricesService.getPrices(req.query);
      return successResponse(res, result.prices, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req, res, next) {
    try {
      const analytics = await PricesService.getAnalytics(req.query);
      return successResponse(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const history = await PricesService.getHistory(req.query);
      return successResponse(res, history);
    } catch (error) {
      next(error);
    }
  }

  static async comparePrices(req, res, next) {
    try {
      const comparison = await PricesService.comparePrices(req.query);
      return successResponse(res, comparison);
    } catch (error) {
      next(error);
    }
  }

  static async getTicker(req, res, next) {
    try {
      const limit = req.query.limit || 15;
      const ticker = await PricesService.getTicker(limit);
      return successResponse(res, ticker);
    } catch (error) {
      next(error);
    }
  }

  static async getPulse(req, res, next) {
    try {
      const pulse = await PricesService.getPulse();
      return successResponse(res, pulse);
    } catch (error) {
      next(error);
    }
  }
}
