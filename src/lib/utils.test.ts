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
  calculateComponentWear,
  calculateDailyUsageRate,
  predictDateForOdometer,
  generateCSV,
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

  describe('calculateComponentWear', () => {
    it('should calculate 100% remaining for brand new component', () => {
      const wear = calculateComponentWear(10000, 5000, 10000);
      expect(wear.kmDrivenSince).toBe(0);
      expect(wear.kmRemaining).toBe(5000);
      expect(wear.percentageRemaining).toBe(100);
      expect(wear.isDue).toBe(false);
      expect(wear.isWarning).toBe(false);
    });

    it('should calculate 50% remaining correctly', () => {
      const wear = calculateComponentWear(10000, 5000, 12500);
      expect(wear.kmDrivenSince).toBe(2500);
      expect(wear.kmRemaining).toBe(2500);
      expect(wear.percentageRemaining).toBe(50);
      expect(wear.isDue).toBe(false);
      expect(wear.isWarning).toBe(false);
    });

    it('should flag warning when remaining is <= 20%', () => {
      const wear = calculateComponentWear(10000, 10000, 18500);
      expect(wear.percentageRemaining).toBe(15);
      expect(wear.isDue).toBe(false);
      expect(wear.isWarning).toBe(true);
    });

    it('should flag due when wear reaches or exceeds 100%', () => {
      const wear = calculateComponentWear(10000, 5000, 16000);
      expect(wear.kmDrivenSince).toBe(6000);
      expect(wear.kmRemaining).toBe(0);
      expect(wear.percentageRemaining).toBe(0);
      expect(wear.isDue).toBe(true);
    });
  });

  describe('calculateDailyUsageRate', () => {
    it('should return 0 when fewer than 2 data points exist without purchase date', () => {
      expect(calculateDailyUsageRate([])).toEqual({ dailyRate: 0, daysCount: 0 });
      expect(calculateDailyUsageRate([{ dateTime: '2026-09-01', odometer: 1000 }])).toEqual({ dailyRate: 0, daysCount: 0 });
    });

    it('should compute km/day over multiple records correctly', () => {
      const records = [
        { dateTime: '2026-09-01T08:00:00', odometer: 1000 },
        { dateTime: '2026-09-11T08:00:00', odometer: 1500 }, // 500 km in 10 days = 50 km/day
      ];
      const res = calculateDailyUsageRate(records);
      expect(res.dailyRate).toBe(50);
      expect(res.daysCount).toBe(10);
    });

    it('should calculate rate from purchase date if only one record exists', () => {
      const records = [
        { dateTime: '2026-09-11T08:00:00', odometer: 1500 },
      ];
      const res = calculateDailyUsageRate(records, 1000, '2026-09-01T08:00:00');
      expect(res.dailyRate).toBe(50);
      expect(res.daysCount).toBe(10);
    });
  });

  describe('predictDateForOdometer', () => {
    it('should predict future calendar milestone based on daily pace', () => {
      const targetOdo = 6000;
      const currentOdo = 5000; // 1000 km delta
      const dailyRate = 50; // 1000 / 50 = 20 days
      const result = predictDateForOdometer(targetOdo, currentOdo, dailyRate);
      expect(result).not.toBeNull();
      expect(result?.daysRemaining).toBe(20);

      const expectedDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      expect(result?.estimatedDate).toBe(expectedDate);
    });

    it('should return null if daily rate is 0 or target is behind current', () => {
      expect(predictDateForOdometer(6000, 5000, 0)).toBeNull();
      expect(predictDateForOdometer(4000, 5000, 50)).toBeNull();
    });
  });

  describe('generateCSV', () => {
    it('should generate valid CSV text with headers and quoted fields where needed', () => {
      const headers = ['Date', 'Item', 'Cost', 'Notes'];
      const rows = [
        ['2026-09-01', 'Oil, Filter', '500', 'Clean & tight'],
        ['2026-09-05', 'Fuel "XP95"', '350', 'Regular'],
      ];
      const csv = generateCSV(headers, rows);
      expect(csv).toContain('Date,Item,Cost,Notes');
      expect(csv).toContain('"Oil, Filter"');
      expect(csv).toContain('"Fuel ""XP95"""');
    });
  });
});
