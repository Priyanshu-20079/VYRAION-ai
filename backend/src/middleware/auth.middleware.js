import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const resolveRole = (email) => {
  if (!email) return 'admin';
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'operator@vyraion.ai' || cleanEmail === 'operator@vyraion.demo') return 'operator';
  if (cleanEmail === 'admin@vyraion.demo') return 'admin';
  if (cleanEmail === 'police@vyraion.demo') return 'authority';
  if (cleanEmail === 'hospital@vyraion.demo') return 'hospital';
  if (cleanEmail === 'investigator@vyraion.demo') return 'investigator';
  if (cleanEmail === 'reviewer@vyraion.demo') return 'reviewer';
  if (cleanEmail === 'user@vyraion.demo') return 'user';
  return 'admin';
};

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('[Auth Middleware] Access denied: Missing Authorization Bearer token.');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    if (req.user && req.user.email) {
      req.user.role = resolveRole(req.user.email);
    }
    logger.info(`[Auth Middleware] JWT Validated for User: ${decoded.email} | role=${req.user.role}`);
    next();
  } catch (err) {
    logger.warn(`[Auth Middleware] JWT Validation Failed: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: 'Token verification failed or expired. Please sign in again.'
    });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    const userRole = req.user?.email ? resolveRole(req.user.email) : (req.user?.role || null);
    const requiredRole = role ? role.toLowerCase() : '';
    if (!req.user || !userRole || userRole !== requiredRole) {
      logger.warn(`[Auth Middleware] Access denied: User ${req.user?.email || 'unknown'} has role ${userRole || 'none'}, needs ${requiredRole}`);
      return res.status(403).json({
        success: false,
        message: `Access Denied - ${requiredRole === 'admin' ? 'Administrator' : requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} privileges required.`
      });
    }
    next();
  };
};
