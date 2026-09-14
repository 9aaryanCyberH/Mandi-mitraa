import { StatesService } from "../services/states.service.js";
import { CommoditiesService } from "../services/commodities.service.js";
import { PricesService } from "../services/prices.service.js";

export class LegacyController {
  /**
   * GET /states
   * Frontend expected response:
   * { "data": ["Andhra Pradesh", "Assam", "Punjab", "West Bengal"] }
   */
  static async getStates(req, res, next) {
    try {
      const states = await StatesService.getAllStateNames();
      return res.status(200).json({ data: states });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /commodities?state=Punjab
   * Frontend expected response:
   * { "data": ["Apple", "Rice", "Wheat"] }
   */
  static async getCommodities(req, res, next) {
    try {
      const state = req.query.state;
      if (!state || typeof state !== "string" || !state.trim()) {
        return res.status(400).json({
          message: "State parameter is required.",
          data: []
        });
      }

      const commodities = await CommoditiesService.getCommoditiesByState(state.trim());
      return res.status(200).json({ data: commodities });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST or GET /getdata
   * Parameters (body or query): state, commodity, date/arrival_date
   */
  static async getData(req, res, next) {
    try {
      const state = req.body?.state || req.query?.state;
      const commodity = req.body?.commodity || req.query?.commodity;
      const date = req.body?.date || req.query?.date || req.query?.arrival_date;

      if (!state || !commodity) {
        return res.status(400).json({
          message: "Both state and commodity are required.",
          data: []
        });
      }

      const records = await PricesService.getLegacyData(
        String(state).trim(),
        String(commodity).trim(),
        date ? String(date).trim() : null
      );
      return res.status(200).json({ data: records });
    } catch (error) {
      next(error);
    }
  }
}
