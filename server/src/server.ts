import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db";
import { validateEnv } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

validateEnv();
connectDB();

const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  "http://localhost:5173",
  // tutaj dodasz produkcyjną domenę gdy będziesz deployować
];

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

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use("/api", limiter);
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
