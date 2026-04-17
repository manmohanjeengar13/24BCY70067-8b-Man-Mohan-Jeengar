import { Router, Request, Response, Router as ExpressRouter } from "express";
import bcrypt from "bcryptjs";
import { findUserByUsername, findUserById } from "../lib/db";
import { signToken } from "../lib/jwt";
import { LoginSchema, validateBody } from "../lib/validation";
import { withAuth } from "../middleware/auth.middleware";
import { AuthenticatedRequest, LoginResponse } from "../types";
import { responses } from "../lib/response";
import { AUTH, VALIDATION, ERRORS, COOKIE_OPTIONS } from "../lib/constants";

const router: ExpressRouter = Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Validates with Zod, checks credentials, returns JWT
 */
router.post("/login", async (req: Request, res: Response) => {
  // 1. Validate request body with Zod
  const validation = validateBody(LoginSchema, req.body);
  if (!validation.success) {
    const errorMessage = validation.errors.map((e) => e.message).join(", ");
    responses.validationError(res, errorMessage);
    return;
  }

  const { username, password } = validation.data;

  // 2. Find user
  const user = await findUserByUsername(username);
  if (!user) {
    responses.unauthorized(res, ERRORS.INVALID_CREDENTIALS);
    return;
  }

  // 3. Compare password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    responses.unauthorized(res, ERRORS.INVALID_CREDENTIALS);
    return;
  }

  // 4. Sign JWT
  const payload = { id: user.id, username: user.username, role: user.role };
  const token = signToken(payload);

  // 5. Set cookie (for Next.js Edge middleware) + return token in body
  res.cookie(AUTH.TOKEN_COOKIE_NAME, token, {
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: COOKIE_OPTIONS.sameSite,
    maxAge: COOKIE_OPTIONS.maxAge,
  });

  const response: LoginResponse = {
    message: `Welcome ${user.username}`,
    token,
    user: payload,
  };

  responses.success(res, "Login successful", response);
});

/**
 * POST /api/auth/logout
 * Clears the auth cookie
 */
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(AUTH.TOKEN_COOKIE_NAME);
  responses.success(res, "Logged out successfully");
});

/**
 * GET /api/auth/me
 * Protected: Requires valid JWT
 * Returns the currently authenticated user's info
 * Used by Next.js ProtectedRoute.tsx on every mount
 */
router.get(
  "/me",
  withAuth(async (req: AuthenticatedRequest, res: Response) => {
    const user = await findUserById(req.user!.id);
    if (!user) {
      responses.notFound(res, ERRORS.USER_NOT_FOUND);
      return;
    }

    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    responses.success(res, "Authenticated", userData);
  })
);

export default router;
