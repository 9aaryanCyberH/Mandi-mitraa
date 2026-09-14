export function successResponse(res, data, statusCode = 200, meta = null) {
  const payload = {
    success: true,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

export function errorResponse(res, message = "Internal server error", statusCode = 500, details = null) {
  const payload = {
    success: false,
    message,
  };

  if (details && process.env.NODE_ENV !== "production") {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
}
