import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import mongoose from "mongoose";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (
    err instanceof mongoose.mongo.MongoServerError &&
    (err as mongoose.mongo.MongoServerError).code === 11000
  ) {
    res.status(409).json({ message: "Resource already exists" });
    return;
  }

  console.error(err instanceof Error ? err.stack : err);
  res.status(500).json({ message: "Internal server error" });
};
