import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  });
}

// Alias for backward compatibility
export const formatCurrency = (amount: number): string => formatAmount(amount);

export function formatDistance(distance: number, unit: string = 'km'): string {
  if (isNaN(distance) || distance === null || distance === undefined) return `0 ${unit}`;
  return `${distance.toLocaleString()} ${unit}`;
}

export function formatEfficiency(kmpl: number, distUnit: string = 'km', volUnit: string = 'L'): string {
  if (!kmpl || isNaN(kmpl) || kmpl <= 0) return `--`;
  return `${kmpl.toFixed(1)} ${distUnit}/${volUnit}`;
}

export function formatCostPerUnit(cost: number, distUnit: string = 'km'): string {
  if (!cost || isNaN(cost) || cost <= 0) return `--`;
  return `${cost.toFixed(2)}/${distUnit}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '--';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '--';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function toDateTimeLocalString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getDaysRemaining(targetDateString?: string): { days: number; isOverdue: boolean; label: string } {
  if (!targetDateString) return { days: 0, isOverdue: false, label: 'N/A' };
  const target = new Date(targetDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isOverdue: true, label: `${Math.abs(diffDays)}d overdue` };
  } else if (diffDays === 0) {
    return { days: 0, isOverdue: false, label: 'Due today' };
  } else {
    return { days: diffDays, isOverdue: false, label: `${diffDays}d left` };
  }
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
