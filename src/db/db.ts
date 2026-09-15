import Dexie, { type Table } from 'dexie';
import type {
  Vehicle,
  FuelRecord,
  ServiceRecord,
  ExpenseRecord,
  Reminder,
  UserSettings,
  VehicleDocument,
  ComponentWearItem,
} from '../types';
import { generateCSV } from '../lib/utils';

export class MyRideDatabase extends Dexie {
  vehicles!: Table<Vehicle, string>;
  fuelRecords!: Table<FuelRecord, string>;
  serviceRecords!: Table<ServiceRecord, string>;
  expenseRecords!: Table<ExpenseRecord, string>;
  reminders!: Table<Reminder, string>;
  settings!: Table<UserSettings, string>;
  documents!: Table<VehicleDocument, string>;
  componentWear!: Table<ComponentWearItem, string>;

  constructor() {
    super('MyRideDB');
    this.version(1).stores({
      vehicles: 'id, name, type, registrationNumber, isArchived, createdAt',
      fuelRecords: 'id, vehicleId, dateTime, odometer, amountSpent, createdAt',
      serviceRecords: 'id, vehicleId, dateTime, odometer, totalCost, createdAt',
      expenseRecords: 'id, vehicleId, dateTime, category, amount, createdAt',
      reminders: 'id, vehicleId, isCompleted, targetDate, targetOdometer, createdAt',
      settings: 'id',
      documents: 'id, vehicleId, category, expiryDate, createdAt',
      componentWear: 'id, vehicleId, type, lastReplacedOdometer, intervalKm, createdAt',
    });
  }
}

export const db = new MyRideDatabase();

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  id: 'user_settings_singleton',
  distanceUnit: 'km',
  fuelVolumeUnit: 'L',
  theme: 'dark',
};

// Demo Vehicle IDs
export const DEMO_VEHICLE_IDS = ['v_hunter_350', 'v_aerox_155'] as const;

// Seed realistic sample data for instant demonstration
export async function seedSampleData(): Promise<void> {
  const v1Id = 'v_hunter_350';
  const v2Id = 'v_aerox_155';

  const sampleVehicles: Vehicle[] = [
    {
      id: v1Id,
      name: 'Hunter 350 (Dapper Ash)',
      type: 'bike',
      make: 'Royal Enfield',
      model: 'Hunter 350',
      year: 2024,
      registrationNumber: 'MH 12 RE 3500',
      colorHex: '#38bdf8',
      fuelType: 'petrol',
      tankCapacityLiters: 13,
      initialOdometer: 50,
      currentOdometer: 6420,
      purchaseDate: '2024-03-10',
      createdAt: '2024-03-10T10:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: v2Id,
      name: 'Aerox 155 Monster Edition',
      type: 'scooter',
      make: 'Yamaha',
      model: 'Aerox 155',
      year: 2023,
      registrationNumber: 'MH 12 YM 1550',
      colorHex: '#a855f7',
      fuelType: 'petrol',
      tankCapacityLiters: 5.5,
      initialOdometer: 120,
      currentOdometer: 9850,
      purchaseDate: '2023-08-20',
      createdAt: '2023-08-20T10:00:00Z',
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleFuelRecords: FuelRecord[] = [
    {
      id: 'f_1',
      vehicleId: v1Id,
      dateTime: '2026-07-02T08:30:00',
      odometer: 4800,
      amountSpent: 1200,
      fuelVolumeLiters: 11.5,
      pricePerLiter: 104.34,
      isFullTank: true,
      stationName: 'Shell Expressway Petrol Pump',
      notes: 'Highway trip start',
      createdAt: '2026-07-02T08:30:00Z',
    },
    {
      id: 'f_2',
      vehicleId: v1Id,
      dateTime: '2026-07-20T17:15:00',
      odometer: 5220,
      amountSpent: 1150,
      fuelVolumeLiters: 11.0,
      pricePerLiter: 104.54,
      isFullTank: true,
      stationName: 'HP Fuel Station, City Center',
      notes: 'Daily city commute',
      createdAt: '2026-07-20T17:15:00Z',
    },
    {
      id: 'f_3',
      vehicleId: v1Id,
      dateTime: '2026-08-14T09:00:00',
      odometer: 5650,
      amountSpent: 1250,
      fuelVolumeLiters: 12.0,
      pricePerLiter: 104.16,
      isFullTank: true,
      stationName: 'BPCL Auto Station',
      notes: 'Weekend breakfast ride',
      createdAt: '2026-08-14T09:00:00Z',
    },
    {
      id: 'f_4',
      vehicleId: v1Id,
      dateTime: '2026-09-02T19:40:00',
      odometer: 6050,
      amountSpent: 1200,
      fuelVolumeLiters: 11.4,
      pricePerLiter: 105.26,
      isFullTank: true,
      stationName: 'Indian Oil Center',
      notes: 'Regular tank refill',
      createdAt: '2026-09-02T19:40:00Z',
    },
    {
      id: 'f_5',
      vehicleId: v1Id,
      dateTime: '2026-09-14T11:20:00',
      odometer: 6420,
      amountSpent: 1100,
      fuelVolumeLiters: 10.5,
      pricePerLiter: 104.76,
      isFullTank: true,
      stationName: 'Shell V-Power Pump',
      notes: 'V-Power premium fuel',
      createdAt: '2026-09-14T11:20:00Z',
    },
    // Aerox Fuel
    {
      id: 'f_a1',
      vehicleId: v2Id,
      dateTime: '2026-08-25T14:10:00',
      odometer: 9600,
      amountSpent: 480,
      fuelVolumeLiters: 4.6,
      pricePerLiter: 104.34,
      isFullTank: true,
      stationName: 'HP Station',
      notes: 'City run',
      createdAt: '2026-08-25T14:10:00Z',
    },
    {
      id: 'f_a2',
      vehicleId: v2Id,
      dateTime: '2026-09-10T18:00:00',
      odometer: 9850,
      amountSpent: 500,
      fuelVolumeLiters: 4.8,
      pricePerLiter: 104.16,
      isFullTank: true,
      stationName: 'BPCL Auto Station',
      notes: 'Full tank',
      createdAt: '2026-09-10T18:00:00Z',
    },
  ];

  const sampleServiceRecords: ServiceRecord[] = [
    {
      id: 's_1',
      vehicleId: v1Id,
      dateTime: '2024-04-15T11:00:00',
      odometer: 500,
      totalCost: 1450,
      serviceTypes: ['general', 'oil_change'],
      mechanicOrCenter: 'Royal Enfield Official Service',
      parts: [
        { id: 'p_1', name: 'Semi-Synthetic Engine Oil 15W50 (2.1L)', cost: 1050, quantity: 1 },
        { id: 'p_2', name: 'Engine Oil Filter', cost: 180, quantity: 1 },
        { id: 'p_3', name: 'Chain Lube & Clean Service', cost: 220, quantity: 1 },
      ],
      laborCost: 0,
      notes: '1st Free Service completed. Checked tappet clearance and chain slackness.',
      createdAt: '2024-04-15T11:00:00Z',
    },
    {
      id: 's_2',
      vehicleId: v1Id,
      dateTime: '2025-02-10T14:30:00',
      odometer: 5000,
      totalCost: 2850,
      serviceTypes: ['general', 'oil_change', 'brakes', 'chain_sprocket'],
      mechanicOrCenter: 'Royal Enfield Service Hub',
      parts: [
        { id: 'p_4', name: 'Motul 7100 10W50 Fully Synthetic Oil', cost: 1650, quantity: 1 },
        { id: 'p_5', name: 'OEM Oil Filter O-Ring kit', cost: 200, quantity: 1 },
        { id: 'p_6', name: 'Brake Fluid Dot 4 Top-up', cost: 150, quantity: 1 },
        { id: 'p_7', name: 'Chain Clean & Motul C2 Lube', cost: 350, quantity: 1 },
      ],
      laborCost: 500,
      notes: '2nd Major Periodic Service. Brake pads checked (70% life remaining).',
      createdAt: '2025-02-10T14:30:00Z',
    },
    // Aerox service
    {
      id: 's_a1',
      vehicleId: v2Id,
      dateTime: '2026-06-12T16:00:00',
      odometer: 8500,
      totalCost: 1800,
      serviceTypes: ['oil_change', 'general', 'air_filter'],
      mechanicOrCenter: 'Yamaha Blue Square Workshop',
      parts: [
        { id: 'p_a1', name: 'Yamalube RS4GP 10W40', cost: 850, quantity: 1 },
        { id: 'p_a2', name: 'Transmission Gear Oil (100ml)', cost: 150, quantity: 1 },
        { id: 'p_a3', name: 'Air Filter Element', cost: 380, quantity: 1 },
      ],
      laborCost: 420,
      notes: 'Periodic maintenance + CVT belt inspection.',
      createdAt: '2026-06-12T16:00:00Z',
    },
  ];

  const sampleExpenseRecords: ExpenseRecord[] = [
    {
      id: 'e_1',
      vehicleId: v1Id,
      dateTime: '2026-03-05T10:00:00',
      category: 'insurance',
      amount: 4200,
      title: 'Comprehensive Insurance Renewal (1 Year)',
      notes: 'Zero Dep + Engine Protect add-on policy with HDFC ERGO.',
      expiryDate: '2027-03-05',
      createdAt: '2026-03-05T10:00:00Z',
    },
    {
      id: 'e_2',
      vehicleId: v1Id,
      dateTime: '2026-05-18T16:20:00',
      category: 'puc',
      amount: 100,
      title: 'PUC (Pollution Certificate)',
      notes: 'Emissions in ideal green range.',
      expiryDate: '2026-11-18',
      createdAt: '2026-05-18T16:20:00Z',
    },
    {
      id: 'e_3',
      vehicleId: v1Id,
      dateTime: '2024-03-20T12:00:00',
      category: 'accessories',
      amount: 3400,
      title: 'Compact Crash Guard & Sump Guard',
      notes: 'OEM Royal Enfield black powder-coated engine guard.',
      createdAt: '2024-03-20T12:00:00Z',
    },
    {
      id: 'e_4',
      vehicleId: v1Id,
      dateTime: '2026-08-30T15:00:00',
      category: 'wash_clean',
      amount: 350,
      title: 'Foam Wash & Ceramic Spray Coating',
      notes: 'Detailing studio wash.',
      createdAt: '2026-08-30T15:00:00Z',
    },
  ];

  const sampleReminders: Reminder[] = [
    {
      id: 'r_1',
      vehicleId: v1Id,
      title: 'Next Periodic Service & Oil Change',
      type: 'both',
      targetOdometer: 10000,
      targetDate: '2026-12-01',
      category: 'service',
      isCompleted: false,
      notes: 'Change engine oil, inspect brake pads & clean air filter.',
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'r_2',
      vehicleId: v1Id,
      title: 'PUC Pollution Certificate Expiry',
      type: 'date',
      targetDate: '2026-11-18',
      category: 'puc',
      isCompleted: false,
      notes: 'Renew PUC certificate to avoid traffic challan.',
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'r_3',
      vehicleId: v1Id,
      title: 'Chain Slackness Check & Lube',
      type: 'odometer',
      targetOdometer: 6900,
      category: 'tyre_check',
      isCompleted: false,
      notes: 'Lube every 500 km.',
      createdAt: '2026-09-01T10:00:00Z',
    },
  ];

  const sampleComponentWear: ComponentWearItem[] = [
    {
      id: 'c_1',
      vehicleId: v1Id,
      name: 'Engine Oil & Filter',
      type: 'engine_oil',
      lastReplacedOdometer: 5000,
      intervalKm: 5000,
      lastReplacedDate: '2025-02-10',
      notes: 'Motul 7100 10W50 Synthetic',
      createdAt: '2025-02-10T14:30:00Z',
    },
    {
      id: 'c_2',
      vehicleId: v1Id,
      name: 'Front & Rear Brake Pads',
      type: 'brake_pads',
      lastReplacedOdometer: 5000,
      intervalKm: 8000,
      lastReplacedDate: '2025-02-10',
      notes: 'Bybre Sintered Pads',
      createdAt: '2025-02-10T14:30:00Z',
    },
    {
      id: 'c_3',
      vehicleId: v1Id,
      name: 'Chain & Sprocket Set',
      type: 'chain_sprocket',
      lastReplacedOdometer: 0,
      intervalKm: 20000,
      notes: 'OEM Brass Coated Chain',
      createdAt: '2024-03-10T10:00:00Z',
    },
    {
      id: 'c_4',
      vehicleId: v1Id,
      name: 'Air Filter Element',
      type: 'air_filter',
      lastReplacedOdometer: 5000,
      intervalKm: 10000,
      lastReplacedDate: '2025-02-10',
      notes: 'Clean every 2500 km, replace at 10000 km',
      createdAt: '2025-02-10T14:30:00Z',
    },
    {
      id: 'c_5',
      vehicleId: v1Id,
      name: 'Tyres (Front & Rear)',
      type: 'front_tyre',
      lastReplacedOdometer: 0,
      intervalKm: 25000,
      notes: 'Ceat Zoom XL Tubeless',
      createdAt: '2024-03-10T10:00:00Z',
    },
    // Aerox wear
    {
      id: 'c_a1',
      vehicleId: v2Id,
      name: 'CVT Drive Belt & Rollers',
      type: 'drive_belt',
      lastReplacedOdometer: 0,
      intervalKm: 18000,
      notes: 'OEM Yamaha V-Belt',
      createdAt: '2023-08-20T10:00:00Z',
    },
  ];

  const sampleDocuments: VehicleDocument[] = [
    {
      id: 'd_1',
      vehicleId: v1Id,
      title: 'Registration Certificate (RC Book)',
      category: 'rc',
      fileName: 'Hunter350_Smart_RC.pdf',
      fileType: 'application/pdf',
      fileSize: 48200,
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAErVAhUKC5JLCktSgUADgsEtQplbmRzdHJlYW0KZW5kb2Jq',
      notes: 'Registration valid up to March 2039',
      createdAt: '2024-03-10T10:00:00Z',
    },
    {
      id: 'd_2',
      vehicleId: v1Id,
      title: 'Comprehensive Insurance Policy (Zero Dep)',
      category: 'insurance',
      expiryDate: '2027-03-05',
      fileName: 'HDFC_ERGO_ZeroDep_Policy.pdf',
      fileType: 'application/pdf',
      fileSize: 76500,
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAErVAhUKC5JLCktSgUADgsEtQplbmRzdHJlYW0KZW5kb2Jq',
      notes: 'Policy No: HDFC-RE-9821734. Includes Roadside Assistance.',
      createdAt: '2026-03-05T10:00:00Z',
    },
    {
      id: 'd_3',
      vehicleId: v1Id,
      title: 'PUC Pollution Certificate',
      category: 'puc',
      expiryDate: '2026-11-18',
      fileName: 'PUC_Green_Certificate.pdf',
      fileType: 'application/pdf',
      fileSize: 31200,
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAErVAhUKC5JLCktSgUADgsEtQplbmRzdHJlYW0KZW5kb2Jq',
      notes: 'Emission test passed with zero carbon excess.',
      createdAt: '2026-05-18T16:20:00Z',
    },
  ];

  await db.transaction('rw', [db.vehicles, db.fuelRecords, db.serviceRecords, db.expenseRecords, db.reminders, db.documents, db.componentWear, db.settings], async () => {
    // Clear any previous demo entries first
    for (const vId of DEMO_VEHICLE_IDS) {
      await db.vehicles.delete(vId);
      await db.fuelRecords.where('vehicleId').equals(vId).delete();
      await db.serviceRecords.where('vehicleId').equals(vId).delete();
      await db.expenseRecords.where('vehicleId').equals(vId).delete();
      await db.reminders.where('vehicleId').equals(vId).delete();
      await db.documents.where('vehicleId').equals(vId).delete();
      await db.componentWear.where('vehicleId').equals(vId).delete();
    }

    await db.vehicles.bulkAdd(sampleVehicles);
    await db.fuelRecords.bulkAdd(sampleFuelRecords);
    await db.serviceRecords.bulkAdd(sampleServiceRecords);
    await db.expenseRecords.bulkAdd(sampleExpenseRecords);
    await db.reminders.bulkAdd(sampleReminders);
    await db.documents.bulkAdd(sampleDocuments);
    await db.componentWear.bulkAdd(sampleComponentWear);

    const existingSettings = await db.settings.get(DEFAULT_SETTINGS.id);
    await db.settings.put({
      ...(existingSettings || DEFAULT_SETTINGS),
      activeVehicleId: v1Id,
    });
  });
}

// Remove all demo vehicles and associated logs
export async function removeSampleData(): Promise<{ success: boolean; count: number }> {
  let removedCount = 0;
  await db.transaction('rw', [db.vehicles, db.fuelRecords, db.serviceRecords, db.expenseRecords, db.reminders, db.documents, db.componentWear, db.settings], async () => {
    for (const vId of DEMO_VEHICLE_IDS) {
      const exists = await db.vehicles.get(vId);
      if (exists) {
        removedCount++;
        await db.vehicles.delete(vId);
        await db.fuelRecords.where('vehicleId').equals(vId).delete();
        await db.serviceRecords.where('vehicleId').equals(vId).delete();
        await db.expenseRecords.where('vehicleId').equals(vId).delete();
        await db.reminders.where('vehicleId').equals(vId).delete();
        await db.documents.where('vehicleId').equals(vId).delete();
        await db.componentWear.where('vehicleId').equals(vId).delete();
      }
    }
  });
  return { success: true, count: removedCount };
}

// Backup & Restore
export async function exportAllDataAsJSON(): Promise<string> {
  const vehicles = await db.vehicles.toArray();
  const fuelRecords = await db.fuelRecords.toArray();
  const serviceRecords = await db.serviceRecords.toArray();
  const expenseRecords = await db.expenseRecords.toArray();
  const reminders = await db.reminders.toArray();
  const documents = await db.documents.toArray();
  const componentWear = await db.componentWear.toArray();
  const settings = await db.settings.toArray();

  const backupData = {
    appName: 'MyRide',
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      vehicles,
      fuelRecords,
      serviceRecords,
      expenseRecords,
      reminders,
      documents,
      componentWear,
      settings,
    },
  };

  return JSON.stringify(backupData, null, 2);
}

export async function exportSingleVehicleAsJSON(vehicleId: string): Promise<string> {
  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle) throw new Error('Vehicle not found in database.');

  const fuelRecords = await db.fuelRecords.where('vehicleId').equals(vehicleId).toArray();
  const serviceRecords = await db.serviceRecords.where('vehicleId').equals(vehicleId).toArray();
  const expenseRecords = await db.expenseRecords.where('vehicleId').equals(vehicleId).toArray();
  const reminders = await db.reminders.where('vehicleId').equals(vehicleId).toArray();
  const documents = await db.documents.where('vehicleId').equals(vehicleId).toArray();
  const componentWear = await db.componentWear.where('vehicleId').equals(vehicleId).toArray();

  const transferPackage = {
    appName: 'MyRide',
    type: 'SINGLE_VEHICLE_TRANSFER_PACKAGE',
    version: 2,
    exportedAt: new Date().toISOString(),
    vehicle,
    fuelRecords,
    serviceRecords,
    expenseRecords,
    reminders,
    documents,
    componentWear,
  };

  return JSON.stringify(transferPackage, null, 2);
}

export async function importSingleVehicleFromJSON(jsonString: string): Promise<{ success: boolean; message: string; vehicleId?: string; vehicleName?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed) throw new Error('Invalid file format.');

    // Single vehicle transfer package
    if (parsed.vehicle && (parsed.type === 'SINGLE_VEHICLE_TRANSFER_PACKAGE' || parsed.vehicle.name)) {
      const v = parsed.vehicle;
      const fuelRecords = Array.isArray(parsed.fuelRecords) ? parsed.fuelRecords : [];
      const serviceRecords = Array.isArray(parsed.serviceRecords) ? parsed.serviceRecords : [];
      const expenseRecords = Array.isArray(parsed.expenseRecords) ? parsed.expenseRecords : [];
      const reminders = Array.isArray(parsed.reminders) ? parsed.reminders : [];
      const documents = Array.isArray(parsed.documents) ? parsed.documents : [];
      const componentWear = Array.isArray(parsed.componentWear) ? parsed.componentWear : [];

      await db.transaction('rw', [db.vehicles, db.fuelRecords, db.serviceRecords, db.expenseRecords, db.reminders, db.documents, db.componentWear, db.settings], async () => {
        await db.vehicles.put(v);
        if (fuelRecords.length > 0) await db.fuelRecords.bulkPut(fuelRecords);
        if (serviceRecords.length > 0) await db.serviceRecords.bulkPut(serviceRecords);
        if (expenseRecords.length > 0) await db.expenseRecords.bulkPut(expenseRecords);
        if (reminders.length > 0) await db.reminders.bulkPut(reminders);
        if (documents.length > 0) await db.documents.bulkPut(documents);
        if (componentWear.length > 0) await db.componentWear.bulkPut(componentWear);

        const existingSettings = await db.settings.get(DEFAULT_SETTINGS.id);
        await db.settings.put({
          ...(existingSettings || DEFAULT_SETTINGS),
          activeVehicleId: v.id,
        });
      });

      return {
        success: true,
        message: `Imported "${v.name}" and full service history into your garage!`,
        vehicleId: v.id,
        vehicleName: v.name,
      };
    }

    // Fallback to full database import if it's a full backup
    return await importAllDataFromJSON(jsonString);
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to import vehicle history.' };
  }
}

export async function importAllDataFromJSON(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed) {
      throw new Error('Invalid backup file format.');
    }

    // Check if it is a single-vehicle package
    if (parsed.vehicle && (parsed.type === 'SINGLE_VEHICLE_TRANSFER_PACKAGE' || parsed.vehicle.name)) {
      return await importSingleVehicleFromJSON(jsonString);
    }

    if (!parsed.data) {
      throw new Error('Invalid backup file format.');
    }

    const { vehicles, fuelRecords, serviceRecords, expenseRecords, reminders, documents, componentWear, settings } = parsed.data;

    await db.transaction('rw', [db.vehicles, db.fuelRecords, db.serviceRecords, db.expenseRecords, db.reminders, db.documents, db.componentWear, db.settings], async () => {
      if (Array.isArray(vehicles) && vehicles.length > 0) {
        await db.vehicles.clear();
        await db.vehicles.bulkAdd(vehicles);
      }
      if (Array.isArray(fuelRecords)) {
        await db.fuelRecords.clear();
        await db.fuelRecords.bulkAdd(fuelRecords);
      }
      if (Array.isArray(serviceRecords)) {
        await db.serviceRecords.clear();
        await db.serviceRecords.bulkAdd(serviceRecords);
      }
      if (Array.isArray(expenseRecords)) {
        await db.expenseRecords.clear();
        await db.expenseRecords.bulkAdd(expenseRecords);
      }
      if (Array.isArray(reminders)) {
        await db.reminders.clear();
        await db.reminders.bulkAdd(reminders);
      }
      if (Array.isArray(documents)) {
        await db.documents.clear();
        await db.documents.bulkAdd(documents);
      }
      if (Array.isArray(componentWear)) {
        await db.componentWear.clear();
        await db.componentWear.bulkAdd(componentWear);
      }
      if (Array.isArray(settings) && settings.length > 0) {
        await db.settings.clear();
        await db.settings.bulkAdd(settings);
      }
    });

    return { success: true, message: `Successfully imported ${vehicles?.length || 0} vehicles and records!` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to import backup data.' };
  }
}

// CSV Export Helpers
export function exportFuelRecordsToCSV(records: FuelRecord[], distUnit = 'km', volUnit = 'L'): string {
  const headers = [
    'Date & Time',
    `Odometer (${distUnit})`,
    `Distance Since Last (${distUnit})`,
    'Amount Spent',
    `Fuel Volume (${volUnit})`,
    `Mileage (${distUnit}/${volUnit})`,
    `Cost Per ${distUnit}`,
    'Station Name',
    'Full Tank',
    'Notes',
  ];

  const rows = records.map(r => [
    r.dateTime,
    r.odometer,
    r.distanceDrivenSinceLast !== undefined ? r.distanceDrivenSinceLast : '',
    r.amountSpent,
    r.fuelVolumeLiters !== undefined ? r.fuelVolumeLiters : '',
    r.calculatedEfficiencyKmpl ? Number(r.calculatedEfficiencyKmpl.toFixed(1)) : '',
    r.costPerKm ? Number(r.costPerKm.toFixed(2)) : '',
    r.stationName || '',
    r.isFullTank ? 'Yes' : 'No',
    r.notes || '',
  ]);

  return generateCSV(headers, rows);
}

export function exportServiceRecordsToCSV(records: ServiceRecord[], distUnit = 'km'): string {
  const headers = [
    'Date & Time',
    `Odometer (${distUnit})`,
    'Service Categories',
    'Total Cost',
    'Workshop / Mechanic',
    'Itemized Parts Replaced',
    'Labor Cost',
    'Notes',
  ];

  const rows = records.map(r => [
    r.dateTime,
    r.odometer,
    r.serviceTypes.map(t => t.replace('_', ' ')).join(', '),
    r.totalCost,
    r.mechanicOrCenter || '',
    r.parts?.map(p => `${p.name} (Qty: ${p.quantity || 1}, Cost: ${p.cost})`).join('; ') || '',
    r.laborCost !== undefined ? r.laborCost : '',
    r.notes || '',
  ]);

  return generateCSV(headers, rows);
}

export function exportExpensesToCSV(records: ExpenseRecord[]): string {
  const headers = [
    'Date & Time',
    'Category',
    'Title / Description',
    'Amount Spent',
    'Odometer',
    'Expiry / Validity Date',
    'Notes',
  ];

  const rows = records.map(r => [
    r.dateTime,
    r.category.toUpperCase().replace('_', ' '),
    r.title,
    r.amount,
    r.odometer !== undefined ? r.odometer : '',
    r.expiryDate || '',
    r.notes || '',
  ]);

  return generateCSV(headers, rows);
}

