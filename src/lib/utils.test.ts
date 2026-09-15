import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  formatCurrency,
  formatDistance,
  formatEfficiency,
  formatCostPerUnit,
  formatDate,
  formatDateTime,
  toDateTimeLocalString,
  getDaysRemaining,
  generateId,
  cn,
} from './utils';

describe('Utility Functions', () => {
  describe('cn (Classnames merge)', () => {
    it('should merge class names correctly', () => {
      expect(cn('bg-red-500', 'p-4')).toBe('bg-red-500 p-4');
      expect(cn('p-2', 'p-4')).toBe('p-4');
      expect(cn('text-sm', undefined, null, false && 'hidden')).toBe('text-sm');
    });
  });

  describe('formatAmount', () => {
    it('should format numbers with comma separators and without currency symbols', () => {
      expect(formatAmount(1500)).toBe('1,500');
      expect(formatAmount(1500.5)).toBe('1,500.50');
      expect(formatAmount(2450000)).toBe('2,450,000');
    });

    it('should handle zero, null, and NaN safely', () => {
      expect(formatAmount(0)).toBe('0');
      expect(formatAmount(NaN)).toBe('0');
    });

    it('formatCurrency alias should behave identically', () => {
      expect(formatCurrency(1500)).toBe('1,500');
    });
  });

  describe('formatDistance', () => {
    it('should format distance with unit', () => {
      expect(formatDistance(5420, 'km')).toBe('5,420 km');
      expect(formatDistance(12000, 'mi')).toBe('12,000 mi');
    });

    it('should handle zero and NaN', () => {
      expect(formatDistance(0, 'km')).toBe('0 km');
      expect(formatDistance(NaN, 'km')).toBe('0 km');
    });
  });

  describe('formatEfficiency', () => {
    it('should format efficiency correctly', () => {
      expect(formatEfficiency(38.5, 'km', 'L')).toBe('38.5 km/L');
      expect(formatEfficiency(42.0, 'mi', 'gal')).toBe('42.0 mi/gal');
    });

    it('should return placeholder for non-positive or NaN values', () => {
      expect(formatEfficiency(0)).toBe('--');
      expect(formatEfficiency(-5)).toBe('--');
      expect(formatEfficiency(NaN)).toBe('--');
    });
  });

  describe('formatCostPerUnit', () => {
    it('should format running cost without currency symbols', () => {
      expect(formatCostPerUnit(2.45, 'km')).toBe('2.45/km');
      expect(formatCostPerUnit(0.15, 'mi')).toBe('0.15/mi');
    });

    it('should return placeholder for non-positive or NaN values', () => {
      expect(formatCostPerUnit(0)).toBe('--');
      expect(formatCostPerUnit(NaN)).toBe('--');
    });
  });

  describe('formatDate and formatDateTime', () => {
    it('should format valid date strings', () => {
      const formatted = formatDate('2026-05-15');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('May');
    });

    it('should return fallback on empty input', () => {
      expect(formatDate(undefined)).toBe('--');
      expect(formatDateTime(undefined)).toBe('--');
    });
  });

  describe('toDateTimeLocalString', () => {
    it('should format dates for datetime-local input fields (YYYY-MM-DDTHH:mm)', () => {
      const testDate = new Date(2026, 8, 15, 14, 30);
      expect(toDateTimeLocalString(testDate)).toBe('2026-09-15T14:30');
    });
  });

  describe('getDaysRemaining', () => {
    it('should calculate days remaining correctly for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const res = getDaysRemaining(future.toISOString().split('T')[0]);
      expect(res.isOverdue).toBe(false);
      expect(res.days).toBe(10);
      expect(res.label).toBe('10d left');
    });

    it('should identify overdue dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 5);
      const res = getDaysRemaining(past.toISOString().split('T')[0]);
      expect(res.isOverdue).toBe(true);
      expect(res.days).toBe(5);
      expect(res.label).toBe('5d overdue');
    });

    it('should identify today', () => {
      const today = new Date();
      const res = getDaysRemaining(today.toISOString().split('T')[0]);
      expect(res.isOverdue).toBe(false);
      expect(res.days).toBe(0);
      expect(res.label).toBe('Due today');
    });

    it('should handle undefined dates safely', () => {
      expect(getDaysRemaining(undefined)).toEqual({ days: 0, isOverdue: false, label: 'N/A' });
    });
  });

  describe('generateId', () => {
    it('should generate unique string identifiers', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toBeDefined();
      expect(typeof id1).toBe('string');
      expect(id1).not.toBe(id2);
    });
  });
});
