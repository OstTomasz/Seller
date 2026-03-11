import dotenv from "dotenv";
dotenv.config();

import app from "./app";

import connectDB from "./config/db";
connectDB();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
