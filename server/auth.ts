/**
 * Campus Pulse - Authentication & Role Authorization Middleware
 * Uses secure scrypt password hashing and HMAC-SHA256 signed session tokens.
 */

import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../src/types/index.ts';

// Server-side secret key for HMAC token signing (falls back to secure random per instance if env unset)
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Hashes a password using crypto.scryptSync with a 16-byte random salt.
 */
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    salt,
    hash: derivedKey.toString('hex'),
  };
}

/**
 * Verifies a candidate password against stored salt and hash using timingSafeEqual.
 */
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(storedHash, 'hex');
    return crypto.timingSafeEqual(derivedKey, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Creates an HMAC-SHA256 signed session token containing user payload.
 */
export function createSessionToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
  hmac.update(payloadB64);
  const signature = hmac.digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Validates a session token signature and returns the payload if valid and unexpired.
 */
export function verifySessionToken(token: string): { userId: string; email: string; role: UserRole; name: string } | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  // Verify HMAC signature
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
  hmac.update(payloadB64);
  const expectedSignature = hmac.digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!decoded.exp || decoded.exp < Date.now()) {
      return null; // Expired
    }
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

/**
 * Express Middleware: Extracts Bearer token, verifies it, and attaches verified user to req.user.
 */
export function authenticateToken(
  getUserById: (id: string) => User | undefined
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow unauthenticated requests to continue as public guests
      return next();
    }

    const token = authHeader.substring(7).trim();
    const payload = verifySessionToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Session token invalid or expired. Please log in again.' });
    }

    const user = getUserById(payload.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account not found or has been deactivated.' });
    }

    req.user = user;
    next();
  };
}

/**
 * Express Middleware: Guard requiring an authenticated user with one of the allowed roles.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to access this resource.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}
