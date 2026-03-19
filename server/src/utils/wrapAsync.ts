import type { NextFunction, Request, Response } from "express";

export type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const wrapAsync = (controller: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    void controller(req, res, next).catch(next);
  };
};

