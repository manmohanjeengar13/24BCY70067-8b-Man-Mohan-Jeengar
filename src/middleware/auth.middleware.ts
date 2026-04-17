import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "../lib/jwt";
import { AuthenticatedRequest } from "../types";
import { responses } from "../lib/response";
import { AUTH, ERRORS } from "../lib/constants";

/**
 * withAuth middleware
 * Extracts Bearer token from Authorization header OR cookie,
 * verifies it with verifyToken(), and attaches user to req.user
 */
export const withAuth = (
  handler: (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => void | Promise<void>
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Try Authorization header first
      const authHeader = req.headers.authorization;
      let token: string | undefined;

      if (authHeader && authHeader.startsWith(AUTH.BEARER_PREFIX)) {
        token = authHeader.slice(AUTH.BEARER_PREFIX.length);
      }

      // 2. Fallback to cookie (for Next.js Edge middleware compat)
      if (!token && req.cookies?.[AUTH.TOKEN_COOKIE_NAME]) {
        token = req.cookies[AUTH.TOKEN_COOKIE_NAME] as string;
      }

      if (!token) {
        responses.unauthorized(res, ERRORS.AUTHENTICATION_REQUIRED);
        return;
      }

      // 3. Verify token
      const decoded = verifyToken(token);

      // 4. Attach user payload to request
      (req as AuthenticatedRequest).user = decoded;

      // 5. Pass to actual handler
      await handler(req as AuthenticatedRequest, res, next);
    } catch (error) {
      if (error instanceof Error) {
        const isExpired = error.message === "jwt expired";
        const message = isExpired ? ERRORS.TOKEN_EXPIRED : ERRORS.INVALID_TOKEN;
        responses.unauthorized(res, message);
        return;
      }

      next(error);
    }
  };
};

/**
 * requireRole middleware (used after withAuth)
 * Checks req.user.role against allowed roles
 * Must be used after withAuth middleware
 */
export const requireRole = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      responses.unauthorized(res, ERRORS.NO_USER_CONTEXT);
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      const rolesList = roles.join(" or ");
      responses.forbidden(
        res,
        `Required role: ${rolesList}. Your role: ${authReq.user.role}`
      );
      return;
    }

    next();
  };
};
