import type { Reminder, Vehicle, UserSettings } from '../types';
import { getDaysRemaining } from './utils';

// Key for storing daily reminder notifications to prevent spam
const NOTIFIED_CACHE_KEY = 'myride_notified_reminders_cache';

/**
 * Checks if the browser/device supports native Notifications API.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined';
}

/**
 * Returns current notification permission state: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

/**
 * Prompts user for notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await window.Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return window.Notification.permission;
  }
}

/**
 * Helper to build asset icon URLs respecting the base URL
 */
function getIconUrl(path: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/**
 * Dispatches a native browser / PWA notification using Service Worker if available,
 * or falling back to the standard Notification constructor.
 */
export async function sendNotification(
  title: string,
  options: NotificationOptions & { url?: string } = {}
): Promise<boolean> {
  if (!isNotificationSupported() || window.Notification.permission !== 'granted') {
    return false;
  }

  const icon = options.icon || getIconUrl('pwa-192x192.svg');
  const badge = options.badge || getIconUrl('pwa-192x192.svg');

  const notificationOptions = {
    icon,
    badge,
    vibrate: [200, 100, 200],
    ...options,
    data: {
      url: options.url || (typeof window !== 'undefined' ? window.location.href : '/'),
      ...(options.data || {}),
    },
  };

  try {
    // Try Service Worker registration first (standard for PWAs, Android WebAPK, and iOS standalone)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Fallback to direct Notification constructor
    new window.Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.error('Error displaying notification:', err);
    // Final fallback attempt
    try {
      new window.Notification(title, notificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Sends a test notification to verify PWA notification delivery on this device.
 */
export async function sendTestNotification(
  vehicleName?: string
): Promise<{ success: boolean; message: string }> {
  if (!isNotificationSupported()) {
    return {
      success: false,
      message: 'Native Notifications are not supported in this browser.',
    };
  }

  let permission = getNotificationPermission();
  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission === 'denied') {
    return {
      success: false,
      message: 'Notification permission is blocked. Please enable notifications in your browser or device settings.',
    };
  }

  if (permission !== 'granted') {
    return {
      success: false,
      message: 'Notification permission was not granted.',
    };
  }

  const vehicleLabel = vehicleName ? ` for ${vehicleName}` : '';
  const sent = await sendNotification('🔔 My Ride - Notification Test', {
    body: `Native PWA notifications are working! Maintenance alerts${vehicleLabel} will be delivered here.`,
    tag: 'test-notification',
  });

  if (sent) {
    return {
      success: true,
      message: 'Test notification sent! Check your notification tray or lock screen.',
    };
  } else {
    return {
      success: false,
      message: 'Could not display test notification. Please verify browser notification permissions.',
    };
  }
}

export interface ReminderDueStatus {
  isDue: boolean;
  isOverdue: boolean;
  reason: string;
}

/**
 * Checks whether a reminder is due or overdue based on odometer and/or calendar date.
 */
export function evaluateReminderDueStatus(
  reminder: Reminder,
  currentOdometer: number = 0,
  warningWindowKm: number = 100,
  warningWindowDays: number = 3
): ReminderDueStatus {
  if (reminder.isCompleted) {
    return { isDue: false, isOverdue: false, reason: '' };
  }

  let odoDue = false;
  let odoOverdue = false;
  let odoReason = '';

  if (reminder.targetOdometer !== undefined && (reminder.type === 'odometer' || reminder.type === 'both')) {
    const diff = reminder.targetOdometer - currentOdometer;
    if (diff <= 0) {
      odoDue = true;
      odoOverdue = true;
      odoReason = `Target reached (${currentOdometer.toLocaleString()} km / ${reminder.targetOdometer.toLocaleString()} km target)`;
    } else if (diff <= warningWindowKm) {
      odoDue = true;
      odoReason = `Approaching target: due in ${diff.toLocaleString()} km`;
    }
  }

  let dateDue = false;
  let dateOverdue = false;
  let dateReason = '';

  if (reminder.targetDate && (reminder.type === 'date' || reminder.type === 'both')) {
    const info = getDaysRemaining(reminder.targetDate);
    if (info.isOverdue) {
      dateDue = true;
      dateOverdue = true;
      dateReason = info.days === 0 ? 'Due today' : `Overdue by ${Math.abs(info.days)} days`;
    } else if (info.days <= warningWindowDays) {
      dateDue = true;
      dateReason = info.days === 0 ? 'Due today' : `Due in ${info.days} days`;
    }
  }

  const isDue = odoDue || dateDue;
  const isOverdue = odoOverdue || dateOverdue;
  const reason = [odoReason, dateReason].filter(Boolean).join(' • ');

  return {
    isDue,
    isOverdue,
    reason,
  };
}

/**
 * Scans active reminders across vehicles and triggers native alerts for due items.
 * Uses a daily local storage cache to avoid repeatedly firing notifications on every state update.
 */
export async function checkAndNotifyDueReminders(
  vehicles: Vehicle[],
  reminders: Reminder[],
  settings: UserSettings
): Promise<number> {
  if (!settings.notificationsEnabled || settings.reminderNotifications === false) {
    return 0;
  }

  if (getNotificationPermission() !== 'granted') {
    return 0;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let notifiedMap: Record<string, string> = {};

  try {
    const raw = localStorage.getItem(NOTIFIED_CACHE_KEY);
    if (raw) {
      notifiedMap = JSON.parse(raw);
    }
  } catch {
    notifiedMap = {};
  }

  const vehicleMap = new Map<string, Vehicle>();
  for (const v of vehicles) {
    vehicleMap.set(v.id, v);
  }

  let sentCount = 0;

  for (const rem of reminders) {
    if (rem.isCompleted) continue;

    // Check if already notified today for this reminder
    if (notifiedMap[rem.id] === todayStr) {
      continue;
    }

    const vehicle = vehicleMap.get(rem.vehicleId);
    const currentOdo = vehicle?.currentOdometer || 0;
    const dueStatus = evaluateReminderDueStatus(rem, currentOdo);

    if (dueStatus.isDue) {
      const vehName = vehicle ? vehicle.name : 'Vehicle';
      const iconPrefix = dueStatus.isOverdue ? '⚠️ OVERDUE' : '🔔 DUE SOON';
      const title = `${iconPrefix}: ${rem.title} (${vehName})`;
      const body = dueStatus.reason
        ? `${dueStatus.reason}.${rem.notes ? ' ' + rem.notes : ''}`
        : `Reminder for ${vehName} is due.${rem.notes ? ' ' + rem.notes : ''}`;

      const sent = await sendNotification(title, {
        body,
        tag: `reminder-${rem.id}`,
      });

      if (sent) {
        notifiedMap[rem.id] = todayStr;
        sentCount++;
      }
    }
  }

  try {
    localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(notifiedMap));
  } catch (err) {
    console.error('Failed to save notified cache:', err);
  }

  return sentCount;
}
