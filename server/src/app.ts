import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import regionRoutes from "./routes/region.routes";
import userRoutes from "./routes/user.routes";
import clientRoutes from "./routes/client.routes";
import notificationRoutes from "./routes/notification.routes";
import eventRoutes from "./routes/event.routes";

import "./models/Region";
import "./models/User";
import "./models/Position";
import "./models/Client";
import "./models/Notification";
import "./models/Event";
import "./models/Invitation";
import "./models/UserProfile";

import { authenticate } from "./middleware/auth.middleware";
import { requirePasswordChange } from "./middleware/mustChangePassword.middleware";

const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const app = express();

app.use(helmet()); //safety HTTP headers
app.use(cors(corsOptions)); //allow only selected origins
app.use(morgan("dev")); //pretty log requests
if (env.NODE_ENV !== "test") {
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.NODE_ENV === "development" ? 1000 : 100,
      message: { message: "Too many requests, please try again later" },
    }),
  );
}
app.use(express.json()); //parse JSON bodies
app.use("/api/auth", authRoutes); // authentication routes

app.use(authenticate); //authenticate every request
app.use(requirePasswordChange); //only users with resetted password can dive into service

app.use("/api/regions", regionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/notifications", authenticate, notificationRoutes);
app.use("/api/events", eventRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
}); //health check

app.use(errorHandler); //global error handler

export default app;
