import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/cypress/**"],

    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    coverage: { reporter: ["text", "html"] },

    env: {
      ...process.env,
      NODE_ENV: "test",
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/crm-test",
      JWT_SECRET: process.env.JWT_SECRET || "test_secret_key_123",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
