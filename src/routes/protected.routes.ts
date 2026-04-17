import { Router, Response, Router as ExpressRouter } from "express";
import { withAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";
import { responses } from "../lib/response";
import { ROLES } from "../lib/constants";

const router: ExpressRouter = Router();

/**
 * GET /api/protected
 * Accessible by ALL authenticated users (admin + user roles)
 * Demonstrates: withAuth() middleware protecting a route
 */
router.get(
  "/",
  withAuth(async (req: AuthenticatedRequest, res: Response) => {
    const userData = {
      message: `Welcome ${req.user!.username}`,
      user: {
        id: req.user!.id,
        username: req.user!.username,
        role: req.user!.role,
      },
      accessedAt: new Date().toISOString(),
      protectedData: "This data is only visible to authenticated users.",
    };

    responses.success(res, `Welcome ${req.user!.username}`, userData);
  })
);

/**
 * GET /api/protected/dashboard
 * Accessible by ALL authenticated users
 * Returns user-specific dashboard data
 */
router.get(
  "/dashboard",
  withAuth(async (req: AuthenticatedRequest, res: Response) => {
    const dashboardData = {
      user: req.user,
      stats: {
        lastLogin: new Date().toISOString(),
        sessionActive: true,
        role: req.user!.role,
      },
      items:
        req.user!.role === ROLES.ADMIN
          ? ["Manage users", "View analytics", "System settings"]
          : ["My profile", "My orders", "Settings"],
    };

    responses.success(res, "Dashboard data retrieved", dashboardData);
  })
);

/**
 * GET /api/protected/admin
 * ADMIN ONLY — uses requireRole middleware after withAuth
 * Demonstrates dual-layer protection: token check + role check
 */
router.get(
  "/admin",
  withAuth(async (req: AuthenticatedRequest, res: Response, next) => {
    // Chain requireRole middleware properly
    requireRole(ROLES.ADMIN)(req, res, () => {
      const adminData = {
        adminUser: req.user,
        adminContent: {
          totalUsers: 3,
          users: [
            { id: 1, username: "admin", role: ROLES.ADMIN },
            { id: 2, username: "john_doe", role: ROLES.USER },
            { id: 3, username: "jane_smith", role: ROLES.USER },
          ],
          systemStatus: "operational",
          serverTime: new Date().toISOString(),
        },
      };
      responses.success(res, "Admin panel access granted", adminData);
    });
  })
);

/**
 * GET /api/protected/profile
 * Accessible by all authenticated users
 * Returns the token-verified user's profile
 */
router.get(
  "/profile",
  withAuth(async (req: AuthenticatedRequest, res: Response) => {
    const profileData = {
      id: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      permissions:
        req.user!.role === ROLES.ADMIN
          ? ["read", "write", "delete", "admin"]
          : ["read"],
    };

    responses.success(res, "Profile retrieved", profileData);
  })
);

export default router;
