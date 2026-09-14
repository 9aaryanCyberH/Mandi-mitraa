import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import { prisma } from "../config/database.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing or invalid");
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired authentication token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      throw new UnauthorizedError("User account no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new ForbiddenError("Administrator access required for this action"));
  }
  next();
}
