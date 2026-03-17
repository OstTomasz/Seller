import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/db";
import { env } from "./config/env";

connectDB();

app.listen(parseInt(env.PORT, 10), () => {
  console.log(`Server running on port ${env.PORT}`);
});
