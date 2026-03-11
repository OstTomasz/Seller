import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

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
  if (err.message.includes("E11000")) {
    res.status(409).json({ message: "Resource already exists" });
    return;
  }

  // nieznany błąd — logujemy i zwracamy 500
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
};
