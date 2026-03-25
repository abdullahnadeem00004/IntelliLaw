import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export type UserRole = 'ADMIN' | 'LAWYER' | 'CLIENT' | 'STAFF';

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - no user' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware to check if user is lawyer or admin
 */
export const requireLawyer = requireRole('LAWYER', 'ADMIN');

/**
 * Middleware to check if user is staff or above
 */
export const requireStaff = requireRole('STAFF', 'LAWYER', 'ADMIN');
