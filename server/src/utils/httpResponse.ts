import type { Response } from "express";

export const ok = <T>(res: Response, data: T): void => {
  res.status(200).json(data);
};

export const created = <T>(res: Response, data: T): void => {
  res.status(201).json(data);
};
