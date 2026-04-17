import "dotenv/config";
import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";
import { getConfig, validateConfig } from "./lib/config";

const config = getConfig();
validateConfig(config);

const app: Express = express();
const PORT = config.PORT;

// ─── Global Middleware ──────────────────────────────────────────────────────

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true, // Required for cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Request Logger ─────────────────────────────────────────────────────────

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const color =
      res.statusCode >= 500
        ? "\x1b[31m" // red
        : res.statusCode >= 400
          ? "\x1b[33m" // yellow
          : "\x1b[32m"; // green
    console.log(
      `${color}${req.method} ${req.path} HTTP/1.1\x1b[0m`,
      `\n  ${JSON.stringify(
        res.statusCode >= 400
          ? { error: res.locals.errorMessage || "Error" }
          : { message: "OK" }
      )}`,
      `\n  ${res.statusCode}\n`
    );
  });
  next();
});

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    },
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────

// Auth routes: /api/auth/login, /api/auth/logout, /api/auth/me
app.use("/api/auth", authRoutes);

// Protected routes: /api/protected, /api/protected/dashboard, etc.
app.use("/api/protected", protectedRoutes);

// ─── Error Handlers ──────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("\x1b[36m");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║     JWT Auth Backend — Express + Zod     ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("\x1b[0m");
  console.log(`\x1b[32m✓\x1b[0m Server on \x1b[4mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[32m✓\x1b[0m Environment: ${config.NODE_ENV}`);
  console.log("\n\x1b[90mTest credentials:");
  console.log("  admin      / admin123    (role: admin)");
  console.log("  john_doe   / password123 (role: user)");
  console.log("  jane_smith / secret456   (role: user)\x1b[0m\n");
});

export default app;
