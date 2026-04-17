/**
 * Environment variable validation and defaults
 * Called at application startup to ensure required env vars are set
 */

interface AppConfig {
  PORT: number;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
}

export const getConfig = (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isDev = nodeEnv === "development";

  // Warn if using fallback JWT_SECRET in production
  const jwtSecret = process.env.JWT_SECRET || "fallback-secret-change-me";
  if (!isDev && jwtSecret === "fallback-secret-change-me") {
    console.warn(
      "\x1b[31m⚠  WARNING: Using fallback JWT_SECRET in production!\x1b[0m"
    );
    console.warn(
      "\x1b[31m   Set JWT_SECRET environment variable for security.\x1b[0m\n"
    );
  }

  const config: AppConfig = {
    PORT: parseInt(process.env.PORT || "3001", 10),
    NODE_ENV: nodeEnv,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  };

  return config;
};

export const validateConfig = (config: AppConfig): void => {
  const errors: string[] = [];

  if (!config.PORT || config.PORT < 1 || config.PORT > 65535) {
    errors.push("PORT must be a valid port number (1-65535)");
  }

  if (!config.JWT_SECRET || config.JWT_SECRET.length < 10) {
    errors.push(
      "JWT_SECRET must be set and at least 10 characters long (production)"
    );
  }

  if (!config.CORS_ORIGIN) {
    errors.push("CORS_ORIGIN must be configured");
  }

  if (errors.length > 0) {
    console.error("\x1b[31m✗ Configuration errors:\x1b[0m");
    errors.forEach((err) => console.error(`  - ${err}`));
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};
