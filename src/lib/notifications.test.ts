import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  evaluateReminderDueStatus,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
  sendTestNotification,
  checkAndNotifyDueReminders,
} from './notifications';
import type { Reminder, Vehicle, UserSettings } from '../types';

describe('Notifications Helper & Reminder Alerts', () => {
  const mockVehicle: Vehicle = {
    id: 'veh_1',
    name: 'Hunter 350',
    type: 'bike',
    make: 'Royal Enfield',
    model: 'Hunter 350',
    registrationNumber: 'MH 12 RE 3500',
    colorHex: '#38bdf8',
    fuelType: 'petrol',
    initialOdometer: 100,
    currentOdometer: 6420,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('evaluateReminderDueStatus', () => {
    it('returns false for completed reminders', () => {
      const reminder: Reminder = {
        id: 'r_done',
        vehicleId: 'veh_1',
        title: 'Oil Change Done',
        type: 'odometer',
        targetOdometer: 5000,
        category: 'service',
        isCompleted: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = evaluateReminderDueStatus(reminder, 6420);
      expect(result.isDue).toBe(false);
      expect(result.isOverdue).toBe(false);
    });

    it('identifies overdue odometer reminders when current odo >= target', () => {
      const reminder: Reminder = {
        id: 'r_odo_overdue',
        vehicleId: 'veh_1',
        title: 'Oil Change',
        type: 'odometer',
        targetOdometer: 6000,
        category: 'service',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = evaluateReminderDueStatus(reminder, 6420);
      expect(result.isDue).toBe(true);
      expect(result.isOverdue).toBe(true);
      expect(result.reason).toContain('Target reached');
    });

    it('identifies approaching odometer reminders within warning window', () => {
      const reminder: Reminder = {
        id: 'r_odo_soon',
        vehicleId: 'veh_1',
        title: 'Chain Lube',
        type: 'odometer',
        targetOdometer: 6500, // 80 km away, within 100km window
        category: 'tyre_check',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = evaluateReminderDueStatus(reminder, 6420, 100);
      expect(result.isDue).toBe(true);
      expect(result.isOverdue).toBe(false);
      expect(result.reason).toContain('due in 80 km');
    });

    it('returns not due for far odometer reminders', () => {
      const reminder: Reminder = {
        id: 'r_odo_far',
        vehicleId: 'veh_1',
        title: 'Major Service',
        type: 'odometer',
        targetOdometer: 10000,
        category: 'service',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = evaluateReminderDueStatus(reminder, 6420, 100);
      expect(result.isDue).toBe(false);
      expect(result.isOverdue).toBe(false);
    });

    it('identifies past due dates as overdue', () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const reminder: Reminder = {
        id: 'r_date_overdue',
        vehicleId: 'veh_1',
        title: 'PUC Expiry',
        type: 'date',
        targetDate: pastDate,
        category: 'puc',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = evaluateReminderDueStatus(reminder, 6420);
      expect(result.isDue).toBe(true);
      expect(result.isOverdue).toBe(true);
      expect(result.reason).toContain('Overdue');
    });

    it('identifies upcoming dates within warning window', () => {
      const soonDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const reminder: Reminder = {
        id: 'r_date_soon',
        vehicleId: 'veh_1',
        title: 'Insurance Renewal',
        type: 'date',
        targetDate: soonDate,
        category: 'insurance',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = evaluateReminderDueStatus(reminder, 6420, 100, 3);
      expect(result.isDue).toBe(true);
      expect(result.isOverdue).toBe(false);
      expect(result.reason).toContain('Due in 2 days');
    });
  });

  describe('Permission & Support check', () => {
    it('detects notification support when window.Notification exists', () => {
      const origNotification = window.Notification;
      // @ts-ignore
      window.Notification = { permission: 'granted', requestPermission: vi.fn() };
      expect(isNotificationSupported()).toBe(true);
      expect(getNotificationPermission()).toBe('granted');
      window.Notification = origNotification;
    });

    it('handles requestNotificationPermission correctly', async () => {
      const origNotification = window.Notification;
      // @ts-ignore
      window.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      };

      const permission = await requestNotificationPermission();
      expect(permission).toBe('granted');
      window.Notification = origNotification;
    });
  });

  describe('checkAndNotifyDueReminders', () => {
    it('does nothing if notificationsEnabled is false', async () => {
      const settings: UserSettings = {
        id: 'user_settings_singleton',
        distanceUnit: 'km',
        fuelVolumeUnit: 'L',
        theme: 'dark',
        notificationsEnabled: false,
        reminderNotifications: true,
      };

      const reminder: Reminder = {
        id: 'r_1',
        vehicleId: 'veh_1',
        title: 'Oil Change',
        type: 'odometer',
        targetOdometer: 5000,
        category: 'service',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const sentCount = await checkAndNotifyDueReminders([mockVehicle], [reminder], settings);
      expect(sentCount).toBe(0);
    });

    it('does not send duplicate notifications for same reminder on same day', async () => {
      const settings: UserSettings = {
        id: 'user_settings_singleton',
        distanceUnit: 'km',
        fuelVolumeUnit: 'L',
        theme: 'dark',
        notificationsEnabled: true,
        reminderNotifications: true,
      };

      const reminder: Reminder = {
        id: 'r_overdue',
        vehicleId: 'veh_1',
        title: 'Oil Change',
        type: 'odometer',
        targetOdometer: 5000,
        category: 'service',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('myride_notified_reminders_cache', JSON.stringify({ r_overdue: todayStr }));

      const sentCount = await checkAndNotifyDueReminders([mockVehicle], [reminder], settings);
      expect(sentCount).toBe(0);
    });
  });
});

