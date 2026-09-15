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

// Wear & Tear Calculation
export function calculateComponentWear(
  lastReplacedOdometer: number,
  intervalKm: number,
  currentOdometer: number
): {
  kmDrivenSince: number;
  kmRemaining: number;
  percentageRemaining: number;
  isDue: boolean;
  isWarning: boolean;
} {
  const safeInterval = Math.max(1, intervalKm);
  const kmDrivenSince = Math.max(0, currentOdometer - (lastReplacedOdometer || 0));
  const rawRemaining = safeInterval - kmDrivenSince;
  const kmRemaining = Math.max(0, rawRemaining);
  const percentageRemaining = Math.max(0, Math.min(100, Math.round((rawRemaining / safeInterval) * 100)));
  const isDue = kmDrivenSince >= safeInterval;
  const isWarning = !isDue && percentageRemaining <= 20;

  return {
    kmDrivenSince,
    kmRemaining,
    percentageRemaining,
    isDue,
    isWarning,
  };
}

// Daily Usage Rate Calculation
export function calculateDailyUsageRate(
  records: { dateTime: string; odometer: number }[],
  initialOdometer: number = 0,
  purchaseDate?: string
): { dailyRate: number; daysCount: number } {
  const validRecords = records
    .filter(r => r.dateTime && !isNaN(r.odometer) && r.odometer > 0)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  if (validRecords.length >= 2) {
    const first = validRecords[0];
    const last = validRecords[validRecords.length - 1];
    const startMs = new Date(first.dateTime).getTime();
    const endMs = new Date(last.dateTime).getTime();
    const diffDays = Math.max(1, (endMs - startMs) / (1000 * 60 * 60 * 24));
    const distDriven = Math.max(0, last.odometer - first.odometer);

    if (distDriven > 0 && diffDays >= 1) {
      const dailyRate = distDriven / diffDays;
      return { dailyRate: Math.round(dailyRate * 10) / 10, daysCount: Math.round(diffDays) };
    }
  }

  // Fallback to purchase date or single record
  if (validRecords.length === 1 && purchaseDate) {
    const record = validRecords[0];
    const startMs = new Date(purchaseDate).getTime();
    const endMs = new Date(record.dateTime).getTime();
    const diffDays = Math.max(1, (endMs - startMs) / (1000 * 60 * 60 * 24));
    const distDriven = Math.max(0, record.odometer - initialOdometer);
    if (distDriven > 0 && diffDays >= 1) {
      const dailyRate = distDriven / diffDays;
      return { dailyRate: Math.round(dailyRate * 10) / 10, daysCount: Math.round(diffDays) };
    }
  }

  return { dailyRate: 0, daysCount: 0 };
}

// Predictive Date Estimation
export function predictDateForOdometer(
  targetOdometer: number,
  currentOdometer: number,
  dailyRate: number
): { estimatedDate: string; daysRemaining: number } | null {
  if (dailyRate <= 0 || targetOdometer <= currentOdometer) return null;

  const distanceLeft = targetOdometer - currentOdometer;
  const daysRemaining = Math.max(1, Math.ceil(distanceLeft / dailyRate));
  const estimatedDateObj = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
  const estimatedDate = estimatedDateObj.toISOString().split('T')[0];

  return {
    estimatedDate,
    daysRemaining,
  };
}

// CSV Export Helpers
export function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCSVCell).join(',');
  const rowLines = rows.map(row => row.map(escapeCSVCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

export function downloadBlob(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Client-Side Image Compression for Offline Vault
export function compressImageBase64(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image (e.g. PDF), convert directly to data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
