import { describe, it, expect } from 'vitest';
import { formatDate, parseQueryNumber, parseQueryBoolean, getPaginationParams } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('parseQueryNumber', () => {
    it('should parse valid number string', () => {
      expect(parseQueryNumber('42')).toBe(42);
      expect(parseQueryNumber('0')).toBe(0);
      expect(parseQueryNumber('999')).toBe(999);
    });

    it('should return default for null', () => {
      expect(parseQueryNumber(null, 10)).toBe(10);
    });

    it('should return default for invalid string', () => {
      expect(parseQueryNumber('invalid', 10)).toBe(10);
    });
  });

  describe('parseQueryBoolean', () => {
    it('should parse true values', () => {
      expect(parseQueryBoolean('true')).toBe(true);
      expect(parseQueryBoolean('TRUE')).toBe(true);
      expect(parseQueryBoolean('1')).toBe(true);
    });

    it('should parse false values', () => {
      expect(parseQueryBoolean('false')).toBe(false);
      expect(parseQueryBoolean('0')).toBe(false);
      expect(parseQueryBoolean('anything')).toBe(false);
    });

    it('should return default for null', () => {
      expect(parseQueryBoolean(null, true)).toBe(true);
      expect(parseQueryBoolean(null, false)).toBe(false);
    });
  });

  describe('getPaginationParams', () => {
    it('should parse pagination params', () => {
      const params = new URLSearchParams('skip=10&limit=25');
      const result = getPaginationParams(params);
      
      expect(result.skip).toBe(10);
      expect(result.limit).toBe(25);
    });

    it('should use defaults for missing params', () => {
      const params = new URLSearchParams();
      const result = getPaginationParams(params);
      
      expect(result.skip).toBe(0);
      expect(result.limit).toBe(50);
    });

    it('should cap limit at 100', () => {
      const params = new URLSearchParams('limit=500');
      const result = getPaginationParams(params);
      
      expect(result.limit).toBe(100);
    });
  });
});
