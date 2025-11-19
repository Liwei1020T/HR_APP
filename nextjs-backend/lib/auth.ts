import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { db } from './db';

// Define UserRole as a type since SQLite doesn't support enums
export type UserRole = 'EMPLOYEE' | 'HR' | 'ADMIN' | 'SUPERADMIN';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ALGORITHM = (process.env.JWT_ALGORITHM || 'HS256') as jwt.Algorithm;
const JWT_EXPIRE_MIN = parseInt(process.env.JWT_EXPIRE_MIN || '30');
const JWT_REFRESH_EXPIRE_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || '7');

export interface TokenPayload {
  sub: string; // user ID as string
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  exp: number;
  iat: number;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  department: string | null;
  isActive: boolean;
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create JWT access token (30 minutes expiry)
 */
export function createAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id.toString(),
    email: user.email,
    role: user.role as UserRole,
    type: 'access',
    iat: now,
    exp: now + JWT_EXPIRE_MIN * 60,
  };
  
  return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM });
}

/**
 * Create JWT refresh token (7 days expiry)
 */
export function createRefreshToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id.toString(),
    email: user.email,
    role: user.role as UserRole,
    type: 'refresh',
    iat: now,
    exp: now + JWT_REFRESH_EXPIRE_DAYS * 24 * 60 * 60,
  };
  
  return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Get authenticated user from request
 * Throws error if no valid token or user not found/inactive
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const token = extractBearerToken(request);
  if (!token) {
    throw new Error('Authentication required');
  }

  const payload = verifyToken(token);
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  const user = await db.user.findUnique({
    where: { id: parseInt(payload.sub) },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('User account is inactive');
  }

  return {
    ...user,
    role: user.role as UserRole,
  };
}

/**
 * Check if user has required role (or higher privilege)
 * Role hierarchy: SUPERADMIN > ADMIN > HR > EMPLOYEE
 */
export function hasRole(user: AuthUser, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<string, number> = {
    'EMPLOYEE': 1,
    'HR': 2,
    'ADMIN': 3,
    'SUPERADMIN': 4,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Require specific role or higher
 */
export async function requireRole(request: NextRequest, requiredRole: UserRole): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (!hasRole(user, requiredRole)) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
  }

  return user;
}

/**
 * Get current user from request (returns null if not authenticated)
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}
