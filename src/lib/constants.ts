/**
 * Application constants
 */

export const AUTH = {
  BEARER_PREFIX: "Bearer ",
  TOKEN_COOKIE_NAME: "token",
  JWT_ISSUER: "jwt-auth-backend",
  JWT_AUDIENCE: "jwt-auth-client",
} as const;

export const VALIDATION = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 50,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 100,
} as const;

export const ERRORS = {
  MISSING_TOKEN: "Missing token",
  INVALID_TOKEN: "Invalid token",
  TOKEN_EXPIRED: "Token expired",
  TOKEN_VERIFICATION_FAILED: "Token verification failed",
  INVALID_CREDENTIALS: "Invalid credentials",
  USER_NOT_FOUND: "User not found",
  AUTHENTICATION_REQUIRED: "Authentication required",
  ACCESS_DENIED: "Access denied",
  NO_USER_CONTEXT: "No user context",
} as const;

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
