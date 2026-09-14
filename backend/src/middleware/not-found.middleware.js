import { errorResponse } from "../utils/response.js";

export function notFoundHandler(req, res) {
  const isLegacyRoute =
    req.path === "/states" ||
    req.path === "/commodities" ||
    req.path === "/getdata";

  if (isLegacyRoute) {
    return res.status(404).json({
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      data: []
    });
  }

  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
