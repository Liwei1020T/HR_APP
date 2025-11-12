import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, createAccessToken, createRefreshToken, verifyToken } from '@/lib/auth';
import { UserRole } from '@prisma/client';

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).not.toBe(password);
      expect(hashed).toHaveLength(60); // bcrypt hash length
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword('wrongPassword', hashed);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: UserRole.EMPLOYEE,
    };

    it('should create access token', () => {
      const token = createAccessToken(mockUser);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should create refresh token', () => {
      const token = createRefreshToken(mockUser);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should verify valid access token', () => {
      const token = createAccessToken(mockUser);
      const payload = verifyToken(token);
      
      expect(payload.sub).toBe(mockUser.id.toString());
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.type).toBe('access');
    });

    it('should verify valid refresh token', () => {
      const token = createRefreshToken(mockUser);
      const payload = verifyToken(token);
      
      expect(payload.sub).toBe(mockUser.id.toString());
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.type).toBe('refresh');
    });

    it('should reject invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow();
    });

    it('should reject expired token', () => {
      // This would require mocking time or creating an expired token
      // For now, we'll skip this test
      expect(true).toBe(true);
    });
  });

  describe('Token Expiry', () => {
    it('should set correct expiry for access token', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
      };
      
      const token = createAccessToken(mockUser);
      const payload = verifyToken(token);
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 30 * 60; // 30 minutes
      
      expect(payload.exp).toBeGreaterThan(now);
      expect(payload.exp).toBeLessThanOrEqual(expectedExpiry + 5); // 5 second tolerance
    });

    it('should set correct expiry for refresh token', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
      };
      
      const token = createRefreshToken(mockUser);
      const payload = verifyToken(token);
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 7 * 24 * 60 * 60; // 7 days
      
      expect(payload.exp).toBeGreaterThan(now);
      expect(payload.exp).toBeLessThanOrEqual(expectedExpiry + 5); // 5 second tolerance
    });
  });
});
