import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, seedSampleData, exportAllDataAsJSON, importAllDataFromJSON } from '../db/db';
import type {
  Vehicle,
  FuelRecord,
  ServiceRecord,
  ExpenseRecord,
  Reminder,
  UserSettings,
  ActivityItem,
} from '../types';
import { generateId } from '../lib/utils';

interface VehicleMetrics {
  totalDistanceDriven: number;
  totalFuelSpent: number;
  totalServiceSpent: number;
  totalOtherExpenses: number;
  totalOverallSpent: number;
  averageFuelEfficiency: number; // km/L
  overallCostPerKm: number;
  fuelCostPerKm: number;
  serviceCostPerKm: number;
  totalFuelVolume: number;
  serviceCount: number;
  partsReplacedCount: number;
  lastOdometer: number;
  lastServiceOdometer?: number;
  lastServiceDate?: string;
  lastFuelDate?: string;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  activeVehicleId: string | null;
  setActiveVehicleId: (id: string) => void;
  isLoading: boolean;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;

  // Computed data for active vehicle
  fuelRecords: FuelRecord[];
  serviceRecords: ServiceRecord[];
  expenseRecords: ExpenseRecord[];
  reminders: Reminder[];
  recentActivities: ActivityItem[];
  metrics: VehicleMetrics;

  // Vehicle Actions
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  // Fuel Actions
  addFuelRecord: (record: Omit<FuelRecord, 'id' | 'createdAt'>) => Promise<string>;
  updateFuelRecord: (id: string, updates: Partial<FuelRecord>) => Promise<void>;
  deleteFuelRecord: (id: string) => Promise<void>;

  // Service Actions
  addServiceRecord: (record: Omit<ServiceRecord, 'id' | 'createdAt'>) => Promise<string>;
  updateServiceRecord: (id: string, updates: Partial<ServiceRecord>) => Promise<void>;
  deleteServiceRecord: (id: string) => Promise<void>;

  // Expense Actions
  addExpenseRecord: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => Promise<string>;
  updateExpenseRecord: (id: string, updates: Partial<ExpenseRecord>) => Promise<void>;
  deleteExpenseRecord: (id: string) => Promise<void>;

  // Reminder Actions
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<string>;
  toggleReminderComplete: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Data helpers
  loadSampleData: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<{ success: boolean; message: string }>;
  clearDatabase: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  // Live queries
  const allVehicles = useLiveQuery(() => db.vehicles.toArray(), []) || [];
  const allFuel = useLiveQuery(() => db.fuelRecords.toArray(), []) || [];
  const allServices = useLiveQuery(() => db.serviceRecords.toArray(), []) || [];
  const allExpenses = useLiveQuery(() => db.expenseRecords.toArray(), []) || [];
  const allReminders = useLiveQuery(() => db.reminders.toArray(), []) || [];
  const settingsArray = useLiveQuery(() => db.settings.toArray(), []) || [];

  const [activeVehicleId, setActiveVehicleIdState] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Settings singleton
  const settings: UserSettings = useMemo(() => {
    return settingsArray.length > 0 ? settingsArray[0] : DEFAULT_SETTINGS;
  }, [settingsArray]);

  // Initialize DB on first launch without auto-seeding
  useEffect(() => {
    async function init() {
      try {
        // Initialize settings if not already present
        const settingsCount = await db.settings.count();
        if (settingsCount === 0) {
          await db.settings.put(DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error('Failed to initialize DB', err);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  // Sync active vehicle ID with settings or fallback to first vehicle
  useEffect(() => {
    if (allVehicles.length > 0) {
      if (activeVehicleId && allVehicles.some(v => v.id === activeVehicleId)) {
        // Current active vehicle still exists
        return;
      }
      if (settings.activeVehicleId && allVehicles.some(v => v.id === settings.activeVehicleId)) {
        setActiveVehicleIdState(settings.activeVehicleId);
      } else {
        setActiveVehicleIdState(allVehicles[0].id);
      }
    } else {
      setActiveVehicleIdState(null);
    }
  }, [allVehicles, settings.activeVehicleId, activeVehicleId]);

  const setActiveVehicleId = useCallback(async (id: string) => {
    setActiveVehicleIdState(id);
    await db.settings.put({
      ...settings,
      activeVehicleId: id,
    });
  }, [settings]);

  const activeVehicle = useMemo(() => {
    if (!activeVehicleId) return null;
    return allVehicles.find(v => v.id === activeVehicleId) || null;
  }, [allVehicles, activeVehicleId]);

  // Filter and process records for active vehicle
  const vehicleFuelRecords = useMemo(() => {
    if (!activeVehicleId) return [];
    const list = allFuel.filter(f => f.vehicleId === activeVehicleId);
    // Sort chronologically ascending to compute distances
    list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    let prevOdo: number | null = null;
    const processed = list.map((record) => {
      let distanceDrivenSinceLast: number | undefined = undefined;
      let calculatedEfficiencyKmpl: number | undefined = undefined;
      let costPerKm: number | undefined = undefined;

      if (prevOdo !== null && record.odometer > prevOdo) {
        distanceDrivenSinceLast = record.odometer - prevOdo;
        if (record.fuelVolumeLiters && record.fuelVolumeLiters > 0) {
          calculatedEfficiencyKmpl = distanceDrivenSinceLast / record.fuelVolumeLiters;
        }
        if (distanceDrivenSinceLast > 0 && record.amountSpent > 0) {
          costPerKm = record.amountSpent / distanceDrivenSinceLast;
        }
      }

      prevOdo = record.odometer;
      return {
        ...record,
        distanceDrivenSinceLast,
        calculatedEfficiencyKmpl,
        costPerKm,
      };
    });

    // Return in reverse chronological order (newest first for UI)
    return processed.reverse();
  }, [allFuel, activeVehicleId]);

  const vehicleServiceRecords = useMemo(() => {
    if (!activeVehicleId) return [];
    return allServices
      .filter(s => s.vehicleId === activeVehicleId)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [allServices, activeVehicleId]);

  const vehicleExpenseRecords = useMemo(() => {
    if (!activeVehicleId) return [];
    return allExpenses
      .filter(e => e.vehicleId === activeVehicleId)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [allExpenses, activeVehicleId]);

  const vehicleReminders = useMemo(() => {
    if (!activeVehicleId) return [];
    return allReminders
      .filter(r => r.vehicleId === activeVehicleId)
      .sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));
  }, [allReminders, activeVehicleId]);

  // Unified activity timeline items
  const recentActivities: ActivityItem[] = useMemo(() => {
    if (!activeVehicleId) return [];
    const activities: ActivityItem[] = [];

    vehicleFuelRecords.forEach(f => {
      activities.push({
        id: `fuel_${f.id}`,
        vehicleId: f.vehicleId,
        type: 'fuel',
        dateTime: f.dateTime,
        odometer: f.odometer,
        title: f.isFullTank ? 'Full Tank Fill-up' : 'Fuel Top-up',
        subtitle: `${f.fuelVolumeLiters ? f.fuelVolumeLiters + ' L @ ' : ''}${f.stationName || 'Fuel Station'}`,
        amount: f.amountSpent,
        badge: 'Fuel',
        badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        raw: f,
      });
    });

    vehicleServiceRecords.forEach(s => {
      const typeNames = s.serviceTypes.map(t => t.replace('_', ' ')).join(', ');
      activities.push({
        id: `service_${s.id}`,
        vehicleId: s.vehicleId,
        type: 'service',
        dateTime: s.dateTime,
        odometer: s.odometer,
        title: s.mechanicOrCenter || 'Vehicle Service',
        subtitle: `${typeNames || 'Maintenance'}${s.parts?.length ? ` (${s.parts.length} parts)` : ''}`,
        amount: s.totalCost,
        badge: 'Service',
        badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        raw: s,
      });
    });

    vehicleExpenseRecords.forEach(e => {
      activities.push({
        id: `expense_${e.id}`,
        vehicleId: e.vehicleId,
        type: 'expense',
        dateTime: e.dateTime,
        odometer: e.odometer,
        title: e.title,
        subtitle: e.category.toUpperCase().replace('_', ' '),
        amount: e.amount,
        badge: e.category.toUpperCase().replace('_', ' '),
        badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        raw: e,
      });
    });

    activities.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    return activities;
  }, [vehicleFuelRecords, vehicleServiceRecords, vehicleExpenseRecords, activeVehicleId]);

  // Compute aggregate statistics
  const metrics: VehicleMetrics = useMemo(() => {
    if (!activeVehicle) {
      return {
        totalDistanceDriven: 0,
        totalFuelSpent: 0,
        totalServiceSpent: 0,
        totalOtherExpenses: 0,
        totalOverallSpent: 0,
        averageFuelEfficiency: 0,
        overallCostPerKm: 0,
        fuelCostPerKm: 0,
        serviceCostPerKm: 0,
        totalFuelVolume: 0,
        serviceCount: 0,
        partsReplacedCount: 0,
        lastOdometer: 0,
      };
    }

    const currentOdo = activeVehicle.currentOdometer || activeVehicle.initialOdometer || 0;
    const initialOdo = activeVehicle.initialOdometer || 0;
    const totalDistanceDriven = Math.max(0, currentOdo - initialOdo);

    const totalFuelSpent = vehicleFuelRecords.reduce((acc, f) => acc + (f.amountSpent || 0), 0);
    const totalFuelVolume = vehicleFuelRecords.reduce((acc, f) => acc + (f.fuelVolumeLiters || 0), 0);
    const totalServiceSpent = vehicleServiceRecords.reduce((acc, s) => acc + (s.totalCost || 0), 0);
    const totalOtherExpenses = vehicleExpenseRecords.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalOverallSpent = totalFuelSpent + totalServiceSpent + totalOtherExpenses;

    // Fuel efficiency calculation
    const efficiencyEntries = vehicleFuelRecords.filter(f => f.calculatedEfficiencyKmpl && f.calculatedEfficiencyKmpl > 0);
    const averageFuelEfficiency = efficiencyEntries.length > 0
      ? efficiencyEntries.reduce((acc, f) => acc + (f.calculatedEfficiencyKmpl || 0), 0) / efficiencyEntries.length
      : totalFuelVolume > 0 && totalDistanceDriven > 0
        ? totalDistanceDriven / totalFuelVolume
        : 0;

    const overallCostPerKm = totalDistanceDriven > 0 ? totalOverallSpent / totalDistanceDriven : 0;
    const fuelCostPerKm = totalDistanceDriven > 0 ? totalFuelSpent / totalDistanceDriven : 0;
    const serviceCostPerKm = totalDistanceDriven > 0 ? totalServiceSpent / totalDistanceDriven : 0;

    let partsCount = 0;
    vehicleServiceRecords.forEach(s => {
      partsCount += (s.parts?.length || 0);
    });

    const lastService = vehicleServiceRecords[0];
    const lastFuel = vehicleFuelRecords[0];

    return {
      totalDistanceDriven,
      totalFuelSpent,
      totalServiceSpent,
      totalOtherExpenses,
      totalOverallSpent,
      averageFuelEfficiency,
      overallCostPerKm,
      fuelCostPerKm,
      serviceCostPerKm,
      totalFuelVolume,
      serviceCount: vehicleServiceRecords.length,
      partsReplacedCount: partsCount,
      lastOdometer: currentOdo,
      lastServiceOdometer: lastService?.odometer,
      lastServiceDate: lastService?.dateTime,
      lastFuelDate: lastFuel?.dateTime,
    };
  }, [activeVehicle, vehicleFuelRecords, vehicleServiceRecords, vehicleExpenseRecords]);

  // Sync latest odometer if any record has a higher odometer
  const syncOdometerIfHigher = useCallback(async (vehicleId: string, odo?: number) => {
    if (!odo) return;
    const vehicle = await db.vehicles.get(vehicleId);
    if (vehicle && odo > vehicle.currentOdometer) {
      await db.vehicles.update(vehicleId, {
        currentOdometer: odo,
        updatedAt: new Date().toISOString(),
      });
    }
  }, []);

  // Vehicle Actions
  const addVehicle = useCallback(async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `veh_${generateId()}`;
    const newVehicle: Vehicle = {
      ...vehicleData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.vehicles.add(newVehicle);
    await setActiveVehicleId(id);
    return id;
  }, [setActiveVehicleId]);

  const updateVehicle = useCallback(async (id: string, updates: Partial<Vehicle>) => {
    await db.vehicles.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    await db.transaction('rw', [db.vehicles, db.fuelRecords, db.serviceRecords, db.expenseRecords, db.reminders], async () => {
      await db.vehicles.delete(id);
      await db.fuelRecords.where('vehicleId').equals(id).delete();
      await db.serviceRecords.where('vehicleId').equals(id).delete();
      await db.expenseRecords.where('vehicleId').equals(id).delete();
      await db.reminders.where('vehicleId').equals(id).delete();
    });
    const remaining = await db.vehicles.toArray();
    if (remaining.length > 0) {
      setActiveVehicleIdState(remaining[0].id);
    } else {
      setActiveVehicleIdState(null);
    }
  }, []);

  // Fuel Actions
  const addFuelRecord = useCallback(async (recordData: Omit<FuelRecord, 'id' | 'createdAt'>) => {
    const id = `fuel_${generateId()}`;
    const newRecord: FuelRecord = {
      ...recordData,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.fuelRecords.add(newRecord);
    await syncOdometerIfHigher(recordData.vehicleId, recordData.odometer);
    return id;
  }, [syncOdometerIfHigher]);

  const updateFuelRecord = useCallback(async (id: string, updates: Partial<FuelRecord>) => {
    await db.fuelRecords.update(id, updates);
    if (updates.vehicleId && updates.odometer) {
      await syncOdometerIfHigher(updates.vehicleId, updates.odometer);
    }
  }, [syncOdometerIfHigher]);

  const deleteFuelRecord = useCallback(async (id: string) => {
    await db.fuelRecords.delete(id);
  }, []);

  // Service Actions
  const addServiceRecord = useCallback(async (recordData: Omit<ServiceRecord, 'id' | 'createdAt'>) => {
    const id = `svc_${generateId()}`;
    const newRecord: ServiceRecord = {
      ...recordData,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.serviceRecords.add(newRecord);
    await syncOdometerIfHigher(recordData.vehicleId, recordData.odometer);
    return id;
  }, [syncOdometerIfHigher]);

  const updateServiceRecord = useCallback(async (id: string, updates: Partial<ServiceRecord>) => {
    await db.serviceRecords.update(id, updates);
    if (updates.vehicleId && updates.odometer) {
      await syncOdometerIfHigher(updates.vehicleId, updates.odometer);
    }
  }, [syncOdometerIfHigher]);

  const deleteServiceRecord = useCallback(async (id: string) => {
    await db.serviceRecords.delete(id);
  }, []);

  // Expense Actions
  const addExpenseRecord = useCallback(async (recordData: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const id = `exp_${generateId()}`;
    const newRecord: ExpenseRecord = {
      ...recordData,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.expenseRecords.add(newRecord);
    if (recordData.odometer) {
      await syncOdometerIfHigher(recordData.vehicleId, recordData.odometer);
    }
    return id;
  }, [syncOdometerIfHigher]);

  const updateExpenseRecord = useCallback(async (id: string, updates: Partial<ExpenseRecord>) => {
    await db.expenseRecords.update(id, updates);
    if (updates.vehicleId && updates.odometer) {
      await syncOdometerIfHigher(updates.vehicleId, updates.odometer);
    }
  }, [syncOdometerIfHigher]);

  const deleteExpenseRecord = useCallback(async (id: string) => {
    await db.expenseRecords.delete(id);
  }, []);

  // Reminder Actions
  const addReminder = useCallback(async (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
    const id = `rem_${generateId()}`;
    const newReminder: Reminder = {
      ...reminderData,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.reminders.add(newReminder);
    return id;
  }, []);

  const toggleReminderComplete = useCallback(async (id: string) => {
    const reminder = await db.reminders.get(id);
    if (reminder) {
      await db.reminders.update(id, { isCompleted: !reminder.isCompleted });
    }
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    await db.reminders.delete(id);
  }, []);

  // Settings Action
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const current = settingsArray.length > 0 ? settingsArray[0] : DEFAULT_SETTINGS;
    await db.settings.put({
      ...current,
      ...newSettings,
    });
  }, [settingsArray]);

  // Database helpers
  const loadSampleData = useCallback(async () => {
    await seedSampleData();
  }, []);

  const exportData = useCallback(async () => {
    return await exportAllDataAsJSON();
  }, []);

  const importData = useCallback(async (json: string) => {
    return await importAllDataFromJSON(json);
  }, []);

  const clearDatabase = useCallback(async () => {
    await db.transaction('rw', [db.vehicles, db.fuelRecords, db.serviceRecords, db.expenseRecords, db.reminders, db.settings], async () => {
      await db.vehicles.clear();
      await db.fuelRecords.clear();
      await db.serviceRecords.clear();
      await db.expenseRecords.clear();
      await db.reminders.clear();
      await db.settings.clear();
    });
    setActiveVehicleIdState(null);
  }, []);

  return (
    <VehicleContext.Provider
      value={{
        vehicles: allVehicles,
        activeVehicle,
        activeVehicleId,
        setActiveVehicleId,
        isLoading: isInitializing,
        settings,
        updateSettings,

        fuelRecords: vehicleFuelRecords,
        serviceRecords: vehicleServiceRecords,
        expenseRecords: vehicleExpenseRecords,
        reminders: vehicleReminders,
        recentActivities,
        metrics,

        addVehicle,
        updateVehicle,
        deleteVehicle,

        addFuelRecord,
        updateFuelRecord,
        deleteFuelRecord,

        addServiceRecord,
        updateServiceRecord,
        deleteServiceRecord,

        addExpenseRecord,
        updateExpenseRecord,
        deleteExpenseRecord,

        addReminder,
        toggleReminderComplete,
        deleteReminder,

        loadSampleData,
        exportData,
        importData,
        clearDatabase,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
}

