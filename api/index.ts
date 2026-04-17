import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../server/src/app";
import connectDB from "../server/src/config/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  return app(req, res);
}
