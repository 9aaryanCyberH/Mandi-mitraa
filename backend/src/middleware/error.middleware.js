import { AppError } from "../utils/errors.js";
import { errorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, err.stack);

  // Check if this is a legacy compatibility endpoint
  const isLegacyRoute =
    req.path === "/states" ||
    req.path === "/commodities" ||
    req.path === "/getdata";

  if (err instanceof AppError) {
    if (isLegacyRoute) {
      return res.status(err.statusCode).json({
        message: err.message,
        data: []
      });
    }
    return errorResponse(res, err.message, err.statusCode, err.details);
  }

  // Handle Prisma Unique Constraint Error (P2002)
  if (err.code === "P2002") {
    const target = err.meta?.target ? err.meta.target.join(", ") : "field";
    const msg = `Duplicate entry for ${target}.`;
    if (isLegacyRoute) {
      return res.status(409).json({ message: msg, data: [] });
    }
    return errorResponse(res, msg, 409);
  }

  // Handle Prisma Record Not Found (P2025)
  if (err.code === "P2025") {
    const msg = "Record not found.";
    if (isLegacyRoute) {
      return res.status(404).json({ message: msg, data: [] });
    }
    return errorResponse(res, msg, 404);
  }

  // Handle SyntaxError (JSON parse error in body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    const msg = "Invalid JSON payload.";
    if (isLegacyRoute) {
      return res.status(400).json({ message: msg, data: [] });
    }
    return errorResponse(res, msg, 400);
  }

  const defaultMsg = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  if (isLegacyRoute) {
    return res.status(500).json({ message: defaultMsg, data: [] });
  }
  return errorResponse(res, defaultMsg, 500, err.stack);
}
