import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  DEFAULT_SETTINGS,
  seedSampleData,
  removeSampleData as removeSampleDataDB,
  DEMO_VEHICLE_IDS,
  exportAllDataAsJSON,
  importAllDataFromJSON,
  exportFuelRecordsToCSV,
  exportServiceRecordsToCSV,
  exportExpensesToCSV,
} from '../db/db';
import type {
  Vehicle,
  FuelRecord,
  ServiceRecord,
  ExpenseRecord,
  Reminder,
  UserSettings,
  ActivityItem,
  VehicleDocument,
  ComponentWearItem,
  ComponentWearStatus,
  PredictiveInsights,
  GarageComparisonVehicle,
} from '../types';
import {
  generateId,
  calculateComponentWear,
  calculateDailyUsageRate,
  predictDateForOdometer,
  downloadBlob,
} from '../lib/utils';

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

  // Documents & Vault
  documents: VehicleDocument[];
  addDocument: (doc: Omit<VehicleDocument, 'id' | 'createdAt'>) => Promise<string>;
  deleteDocument: (id: string) => Promise<void>;

  // Component Wear & Tear Life
  componentWear: ComponentWearStatus[];
  addComponentWear: (item: Omit<ComponentWearItem, 'id' | 'createdAt'>) => Promise<string>;
  updateComponentWear: (id: string, updates: Partial<ComponentWearItem>) => Promise<void>;
  resetComponentWear: (id: string, newOdometer?: number) => Promise<void>;
  deleteComponentWear: (id: string) => Promise<void>;

  // Smart Predictive Insights
  predictiveInsights: PredictiveInsights;

  // Garage-wide comparison
  garageComparison: GarageComparisonVehicle[];

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
  hasDemoData: boolean;
  loadSampleData: () => Promise<void>;
  removeSampleData: () => Promise<{ success: boolean; count: number }>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<{ success: boolean; message: string }>;
  clearDatabase: () => Promise<void>;

  // CSV & Web Share
  exportFuelCSV: () => void;
  exportServiceCSV: () => void;
  exportExpensesCSV: () => void;
  shareBackupData: () => Promise<boolean>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  // Live queries
  const allVehicles = useLiveQuery(() => db.vehicles.toArray(), []) || [];
  const allFuel = useLiveQuery(() => db.fuelRecords.toArray(), []) || [];
  const allServices = useLiveQuery(() => db.serviceRecords.toArray(), []) || [];
  const allExpenses = useLiveQuery(() => db.expenseRecords.toArray(), []) || [];
  const allReminders = useLiveQuery(() => db.reminders.toArray(), []) || [];
  const allDocuments = useLiveQuery(() => db.documents.toArray(), []) || [];
  const allComponentWear = useLiveQuery(() => db.componentWear.toArray(), []) || [];
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

  // Documents for active vehicle
  const vehicleDocuments = useMemo(() => {
    if (!activeVehicleId) return [];
    return allDocuments
      .filter(d => d.vehicleId === activeVehicleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allDocuments, activeVehicleId]);

  // Component Wear Status for active vehicle
  const vehicleComponentWear: ComponentWearStatus[] = useMemo(() => {
    if (!activeVehicle || !activeVehicleId) return [];
    const currentOdo = activeVehicle.currentOdometer || activeVehicle.initialOdometer || 0;
    return allComponentWear
      .filter(c => c.vehicleId === activeVehicleId)
      .map(c => {
        const wear = calculateComponentWear(c.lastReplacedOdometer, c.intervalKm, currentOdo);
        return {
          ...c,
          ...wear,
        };
      })
      .sort((a, b) => a.percentageRemaining - b.percentageRemaining);
  }, [allComponentWear, activeVehicle, activeVehicleId]);

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

  // Smart Predictive Insights
  const predictiveInsights: PredictiveInsights = useMemo(() => {
    if (!activeVehicle || !activeVehicleId) {
      return {
        dailyUsageRateKm: 0,
        weeklyUsageRateKm: 0,
        daysLogged: 0,
        componentPredictions: [],
      };
    }

    const usage = calculateDailyUsageRate(
      [...vehicleFuelRecords, ...vehicleServiceRecords],
      activeVehicle.initialOdometer || 0,
      activeVehicle.purchaseDate
    );

    const currentOdo = activeVehicle.currentOdometer || activeVehicle.initialOdometer || 0;
    const dailyRate = usage.dailyRate;
    const weeklyRate = Math.round(dailyRate * 7 * 10) / 10;

    let nextServicePrediction: PredictiveInsights['nextServicePrediction'] = undefined;
    const incompleteServiceReminder = vehicleReminders.find(
      r => !r.isCompleted && (r.category === 'service' || r.type === 'odometer' || r.type === 'both') && r.targetOdometer && r.targetOdometer > currentOdo
    );

    let targetOdo = incompleteServiceReminder?.targetOdometer;
    let reason = incompleteServiceReminder ? incompleteServiceReminder.title : 'Next Periodic Maintenance';

    if (!targetOdo) {
      targetOdo = (Math.floor(currentOdo / 5000) + 1) * 5000;
    }

    if (dailyRate > 0 && targetOdo > currentOdo) {
      const pred = predictDateForOdometer(targetOdo, currentOdo, dailyRate);
      if (pred) {
        nextServicePrediction = {
          targetOdometer: targetOdo,
          estimatedDate: pred.estimatedDate,
          daysRemaining: pred.daysRemaining,
          reason,
        };
      }
    }

    const componentPredictions = vehicleComponentWear
      .filter(c => dailyRate > 0 && c.kmRemaining > 0)
      .map(c => {
        const target = (c.lastReplacedOdometer || 0) + c.intervalKm;
        const pred = predictDateForOdometer(target, currentOdo, dailyRate);
        return {
          componentName: c.name,
          estimatedDueDate: pred?.estimatedDate || '',
          daysRemaining: pred?.daysRemaining || 0,
          remainingKm: c.kmRemaining,
        };
      })
      .filter(c => c.daysRemaining > 0)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      dailyUsageRateKm: dailyRate,
      weeklyUsageRateKm: weeklyRate,
      daysLogged: usage.daysCount,
      nextServicePrediction,
      componentPredictions,
    };
  }, [activeVehicle, activeVehicleId, vehicleFuelRecords, vehicleServiceRecords, vehicleReminders, vehicleComponentWear]);

  // Garage Comparison Matrix
  const garageComparison: GarageComparisonVehicle[] = useMemo(() => {
    return allVehicles.map(veh => {
      const fuels = allFuel.filter(f => f.vehicleId === veh.id);
      const services = allServices.filter(s => s.vehicleId === veh.id);
      const expenses = allExpenses.filter(e => e.vehicleId === veh.id);
      const docs = allDocuments.filter(d => d.vehicleId === veh.id);

      const totalFuelSpent = fuels.reduce((acc, f) => acc + (f.amountSpent || 0), 0);
      const totalFuelVol = fuels.reduce((acc, f) => acc + (f.fuelVolumeLiters || 0), 0);
      const totalServiceSpent = services.reduce((acc, s) => acc + (s.totalCost || 0), 0);
      const totalOtherExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
      const totalOverallSpent = totalFuelSpent + totalServiceSpent + totalOtherExpenses;

      const currentOdo = veh.currentOdometer || veh.initialOdometer || 0;
      const totalDistanceDriven = Math.max(0, currentOdo - (veh.initialOdometer || 0));

      const effEntries = fuels.filter(f => f.calculatedEfficiencyKmpl && f.calculatedEfficiencyKmpl > 0);
      const averageFuelEfficiency = effEntries.length > 0
        ? effEntries.reduce((acc, f) => acc + (f.calculatedEfficiencyKmpl || 0), 0) / effEntries.length
        : totalFuelVol > 0 && totalDistanceDriven > 0
          ? totalDistanceDriven / totalFuelVol
          : 0;

      const overallCostPerKm = totalDistanceDriven > 0 ? totalOverallSpent / totalDistanceDriven : 0;
      const fuelCostPerKm = totalDistanceDriven > 0 ? totalFuelSpent / totalDistanceDriven : 0;
      const serviceCostPerKm = totalDistanceDriven > 0 ? totalServiceSpent / totalDistanceDriven : 0;

      return {
        vehicle: veh,
        totalDistanceDriven,
        totalFuelSpent,
        totalServiceSpent,
        totalOtherExpenses,
        totalOverallSpent,
        averageFuelEfficiency,
        overallCostPerKm,
        fuelCostPerKm,
        serviceCostPerKm,
        serviceCount: services.length,
        documentsCount: docs.length,
      };
    });
  }, [allVehicles, allFuel, allServices, allExpenses, allDocuments]);

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
    await db.transaction('rw', [db.vehicles, db.fuelRecords, db.serviceRecords, db.expenseRecords, db.reminders, db.documents, db.componentWear], async () => {
      await db.vehicles.delete(id);
      await db.fuelRecords.where('vehicleId').equals(id).delete();
      await db.serviceRecords.where('vehicleId').equals(id).delete();
      await db.expenseRecords.where('vehicleId').equals(id).delete();
      await db.reminders.where('vehicleId').equals(id).delete();
      await db.documents.where('vehicleId').equals(id).delete();
      await db.componentWear.where('vehicleId').equals(id).delete();
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

  // Document Vault Actions
  const addDocument = useCallback(async (docData: Omit<VehicleDocument, 'id' | 'createdAt'>) => {
    const id = `doc_${generateId()}`;
    const newDoc: VehicleDocument = {
      ...docData,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.documents.add(newDoc);
    return id;
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    await db.documents.delete(id);
  }, []);

  // Component Wear Actions
  const addComponentWear = useCallback(async (itemData: Omit<ComponentWearItem, 'id' | 'createdAt'>) => {
    const id = `comp_${generateId()}`;
    const newItem: ComponentWearItem = {
      ...itemData,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.componentWear.add(newItem);
    return id;
  }, []);

  const updateComponentWear = useCallback(async (id: string, updates: Partial<ComponentWearItem>) => {
    await db.componentWear.update(id, updates);
  }, []);

  const resetComponentWear = useCallback(async (id: string, newOdometer?: number) => {
    const item = await db.componentWear.get(id);
    if (!item) return;
    const vehicle = await db.vehicles.get(item.vehicleId);
    const targetOdo = newOdometer !== undefined ? newOdometer : vehicle?.currentOdometer || item.lastReplacedOdometer;
    await db.componentWear.update(id, {
      lastReplacedOdometer: targetOdo,
      lastReplacedDate: new Date().toISOString().split('T')[0],
    });
  }, []);

  const deleteComponentWear = useCallback(async (id: string) => {
    await db.componentWear.delete(id);
  }, []);

  // Settings Action
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const current = settingsArray.length > 0 ? settingsArray[0] : DEFAULT_SETTINGS;
    await db.settings.put({
      ...current,
      ...newSettings,
    });
  }, [settingsArray]);

  // Demo Data State
  const hasDemoData = useMemo(() => {
    return allVehicles.some(v => (DEMO_VEHICLE_IDS as readonly string[]).includes(v.id));
  }, [allVehicles]);

  // Database helpers
  const loadSampleData = useCallback(async () => {
    await seedSampleData();
  }, []);

  const removeSampleData = useCallback(async () => {
    const res = await removeSampleDataDB();
    const remaining = await db.vehicles.toArray();
    if (remaining.length > 0) {
      if (!remaining.some(v => v.id === activeVehicleId)) {
        setActiveVehicleIdState(remaining[0].id);
        await db.settings.put({
          ...settings,
          activeVehicleId: remaining[0].id,
        });
      }
    } else {
      setActiveVehicleIdState(null);
      await db.settings.put({
        ...settings,
        activeVehicleId: undefined,
      });
    }
    return res;
  }, [activeVehicleId, settings]);

  const exportData = useCallback(async () => {
    return await exportAllDataAsJSON();
  }, []);

  const importData = useCallback(async (json: string) => {
    return await importAllDataFromJSON(json);
  }, []);

  const clearDatabase = useCallback(async () => {
    await db.transaction('rw', [db.vehicles, db.fuelRecords, db.serviceRecords, db.expenseRecords, db.reminders, db.documents, db.componentWear, db.settings], async () => {
      await db.vehicles.clear();
      await db.fuelRecords.clear();
      await db.serviceRecords.clear();
      await db.expenseRecords.clear();
      await db.reminders.clear();
      await db.documents.clear();
      await db.componentWear.clear();
      await db.settings.clear();
    });
    setActiveVehicleIdState(null);
  }, []);

  // CSV Exports
  const exportFuelCSV = useCallback(() => {
    if (!activeVehicle) return;
    const csvContent = exportFuelRecordsToCSV(vehicleFuelRecords, settings.distanceUnit, settings.fuelVolumeUnit);
    const filename = `${activeVehicle.name.replace(/\s+/g, '_')}_Fuel_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    downloadBlob(csvContent, filename);
  }, [activeVehicle, vehicleFuelRecords, settings]);

  const exportServiceCSV = useCallback(() => {
    if (!activeVehicle) return;
    const csvContent = exportServiceRecordsToCSV(vehicleServiceRecords, settings.distanceUnit);
    const filename = `${activeVehicle.name.replace(/\s+/g, '_')}_Service_History_${new Date().toISOString().split('T')[0]}.csv`;
    downloadBlob(csvContent, filename);
  }, [activeVehicle, vehicleServiceRecords, settings]);

  const exportExpensesCSV = useCallback(() => {
    if (!activeVehicle) return;
    const csvContent = exportExpensesToCSV(vehicleExpenseRecords);
    const filename = `${activeVehicle.name.replace(/\s+/g, '_')}_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
    downloadBlob(csvContent, filename);
  }, [activeVehicle, vehicleExpenseRecords]);

  // Native Web Share API
  const shareBackupData = useCallback(async () => {
    try {
      const jsonString = await exportData();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `my_ride_backup_${dateStr}.json`;

      if (navigator.canShare && navigator.canShare({ files: [new File([jsonString], filename, { type: 'application/json' })] })) {
        const file = new File([jsonString], filename, { type: 'application/json' });
        await navigator.share({
          title: 'My Ride Fleet Backup',
          text: `My Ride vehicle backup (${dateStr})`,
          files: [file],
        });
        return true;
      } else if (navigator.share) {
        await navigator.share({
          title: 'My Ride Fleet Backup',
          text: jsonString,
        });
        return true;
      } else {
        // Fallback to standard download
        downloadBlob(jsonString, filename, 'application/json');
        return false;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share failed', err);
      }
      return false;
    }
  }, [exportData]);

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

        documents: vehicleDocuments,
        addDocument,
        deleteDocument,

        componentWear: vehicleComponentWear,
        addComponentWear,
        updateComponentWear,
        resetComponentWear,
        deleteComponentWear,

        predictiveInsights,
        garageComparison,

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

        hasDemoData,
        loadSampleData,
        removeSampleData,
        exportData,
        importData,
        clearDatabase,

        exportFuelCSV,
        exportServiceCSV,
        exportExpensesCSV,
        shareBackupData,
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

