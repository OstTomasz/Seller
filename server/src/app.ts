import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { validateEnv } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import regionRoutes from "./routes/region.routes";

import "./models/Region";
import "./models/User";

validateEnv();

const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later" },
});

const app = express();

app.use(helmet()); //safety HTTP headers
app.use(cors(corsOptions)); //allow only selected origins
app.use(morgan("dev")); //pretty log requests
app.use("/api", limiter); //limit requests
app.use(express.json()); //parse JSON bodies
app.use("/api/auth", authRoutes); // authentication routes
app.use("/api/regions", regionRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
}); //health check

app.use(errorHandler); //global error handler

export default app;
