export type VehicleType = 'bike' | 'scooter' | 'car' | 'ev' | 'other';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'cng' | 'hybrid';

export interface Vehicle {
  id: string;
  name: string; // e.g. "Royal Enfield Hunter 350"
  type: VehicleType;
  make: string; // e.g. "Royal Enfield"
  model: string; // e.g. "Hunter 350"
  year?: number;
  registrationNumber: string; // e.g. "MH 12 AB 1234"
  colorHex: string; // e.g. "#38bdf8"
  fuelType: FuelType;
  tankCapacityLiters?: number; // e.g. 13
  initialOdometer: number; // km at vehicle purchase/logging start
  currentOdometer: number; // latest km
  purchaseDate?: string; // YYYY-MM-DD
  photoUrl?: string; // base64 or URL
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  dateTime: string; // ISO string e.g. "2026-09-15T10:00:00"
  odometer: number; // km at fill-up
  amountSpent: number; // total money spent e.g. 1500
  fuelVolumeLiters?: number; // e.g. 14.5
  pricePerLiter?: number; // e.g. 103.4
  isFullTank: boolean; // whether filled to brim
  stationName?: string; // e.g. "Shell Expressway"
  notes?: string;
  // Computed fields (for display/analytics)
  distanceDrivenSinceLast?: number;
  calculatedEfficiencyKmpl?: number;
  costPerKm?: number;
  createdAt: string;
}

export type ServiceTypeCategory =
  | 'general'
  | 'oil_change'
  | 'brakes'
  | 'chain_sprocket'
  | 'tyres'
  | 'battery'
  | 'air_filter'
  | 'spark_plug'
  | 'electrical'
  | 'body_repair'
  | 'detailing'
  | 'custom';

export interface ServicePartItem {
  id: string;
  name: string; // e.g. "Motul 7100 10W50 Synthetic Oil"
  cost: number;
  quantity?: number;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  dateTime: string; // ISO string
  odometer: number; // km at service
  totalCost: number;
  serviceTypes: ServiceTypeCategory[]; // multi-select tags
  mechanicOrCenter?: string; // e.g. "Authorized RE Service Center"
  parts: ServicePartItem[]; // itemized parts
  laborCost?: number;
  notes?: string;
  invoiceUrl?: string; // receipt image
  createdAt: string;
}

export type ExpenseCategory =
  | 'insurance'
  | 'puc'
  | 'toll'
  | 'parking'
  | 'accessories'
  | 'fine_challan'
  | 'wash_clean'
  | 'modification'
  | 'other';

export interface ExpenseRecord {
  id: string;
  vehicleId: string;
  dateTime: string;
  odometer?: number;
  category: ExpenseCategory;
  amount: number;
  title: string;
  notes?: string;
  expiryDate?: string; // for insurance / PUC renewal
  createdAt: string;
}

export type ReminderType = 'odometer' | 'date' | 'both';

export interface Reminder {
  id: string;
  vehicleId: string;
  title: string; // e.g. "Next Engine Oil Change"
  type: ReminderType;
  targetOdometer?: number; // e.g. 15000 km
  targetDate?: string; // e.g. "2026-11-01"
  category: 'service' | 'insurance' | 'puc' | 'tyre_check' | 'other';
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  distanceUnit: 'km' | 'mi';
  fuelVolumeUnit: 'L' | 'gal';
  activeVehicleId?: string;
  theme: 'dark' | 'light' | 'system';
}

export type ActivityItem = {
  id: string;
  vehicleId: string;
  type: 'fuel' | 'service' | 'expense';
  dateTime: string;
  odometer?: number;
  title: string;
  subtitle: string;
  amount: number;
  badge: string;
  badgeColor: string;
  raw: FuelRecord | ServiceRecord | ExpenseRecord;
};

