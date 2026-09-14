import { AuthService } from "../services/auth.service.js";
import { successResponse } from "../utils/response.js";

export class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, name, role } = req.body;
      const result = await AuthService.register({ email, password, name, role });
      return successResponse(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      return successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const profile = await AuthService.getProfile(req.user.id);
      return successResponse(res, profile, 200);
    } catch (error) {
      next(error);
    }
  }
}
