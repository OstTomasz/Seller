// import "express";

// declare global {
//   namespace Express {
//     interface Request {
//       userId?: string;
//       userRole?: "director" | "deputy" | "advisor" | "salesperson";
//       mustChangePassword?: boolean;
//     }
//   }
// }

// export {};

import { UserRole } from "../types";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
      mustChangePassword?: boolean;
    }
  }
}
