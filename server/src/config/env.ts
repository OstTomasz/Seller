const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "PORT"];

export const validateEnv = (): void => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
};
