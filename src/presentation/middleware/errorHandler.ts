import {Request, Response, NextFunction} from "express";
import {logger} from "@/infrastructure/logging/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error("Unhandled error:", err);
  res.status(500).json({error: message});
}
