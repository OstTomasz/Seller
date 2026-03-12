import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import mongoose from "mongoose";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  //known error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // MongoDB dup
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    res.status(409).json({ message: "Resource already exists" });
    return;
  }

  // nieznany błąd — logujemy i zwracamy 500
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
};
