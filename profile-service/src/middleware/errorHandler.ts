import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/file-validator.util";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    console.error(`[AppError] ${err.status}: ${err.message}`);
    return res.status(err.status).json({
      success: false,
      message: err.message,
      statusCode: err.status,
    });
  }

  const error = err as any;
  console.error(error);

  return res.status(500).json({
    success: false,
    message: error?.message ?? "Internal server error",
    statusCode: 500,
  });
}
