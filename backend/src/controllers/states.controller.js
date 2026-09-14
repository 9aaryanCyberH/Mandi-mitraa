import { StatesService } from "../services/states.service.js";
import { successResponse } from "../utils/response.js";

export class StatesController {
  static async getAll(req, res, next) {
    try {
      const states = await StatesService.getAllStates();
      return successResponse(res, states);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const state = await StatesService.getStateById(req.params.stateId);
      return successResponse(res, state);
    } catch (error) {
      next(error);
    }
  }
}
