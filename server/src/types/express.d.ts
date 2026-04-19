import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: "director" | "deputy" | "advisor" | "salesperson";
      mustChangePassword?: boolean;
    }
  }
}

export {};
