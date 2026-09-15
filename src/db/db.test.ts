import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  seedSampleData,
  removeSampleData,
  exportAllDataAsJSON,
  importAllDataFromJSON,
  exportFuelRecordsToCSV,
  exportServiceRecordsToCSV,
  exportExpensesToCSV,
} from './db';

describe('Dexie Database & Storage Layer', () => {
  beforeEach(async () => {
    await db.vehicles.clear();
    await db.fuelRecords.clear();
    await db.serviceRecords.clear();
    await db.expenseRecords.clear();
    await db.reminders.clear();
    await db.documents.clear();
    await db.componentWear.clear();
    await db.settings.clear();
  });

  it('should seed realistic sample vehicles, logs, documents, and component wear items', async () => {
    await seedSampleData();

    const vehicles = await db.vehicles.toArray();
    const fuel = await db.fuelRecords.toArray();
    const services = await db.serviceRecords.toArray();
    const expenses = await db.expenseRecords.toArray();
    const reminders = await db.reminders.toArray();
    const documents = await db.documents.toArray();
    const wearItems = await db.componentWear.toArray();

    expect(vehicles.length).toBeGreaterThanOrEqual(2);
    expect(fuel.length).toBeGreaterThan(0);
    expect(services.length).toBeGreaterThan(0);
    expect(expenses.length).toBeGreaterThan(0);
    expect(reminders.length).toBeGreaterThan(0);
    expect(documents.length).toBeGreaterThan(0);
    expect(wearItems.length).toBeGreaterThan(0);

    const hunter = vehicles.find(v => v.name.includes('Hunter'));
    expect(hunter).toBeDefined();
    expect(hunter?.make).toBe('Royal Enfield');
  });

  it('should remove demo data while preserving user vehicles and records', async () => {
    // 1. Seed demo data
    await seedSampleData();
    expect(await db.vehicles.count()).toBe(2);

    // 2. Add a custom user vehicle & custom document
    const userVehicleId = 'veh_custom_duke';
    await db.vehicles.add({
      id: userVehicleId,
      name: 'My KTM Duke 390',
      type: 'bike',
      make: 'KTM',
      model: 'Duke 390',
      year: 2024,
      registrationNumber: 'DL 01 AB 1234',
      colorHex: '#f97316',
      fuelType: 'petrol',
      tankCapacityLiters: 13.5,
      initialOdometer: 100,
      currentOdometer: 1500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.fuelRecords.add({
      id: 'fuel_custom_1',
      vehicleId: userVehicleId,
      dateTime: '2026-09-01T10:00:00',
      odometer: 500,
      amountSpent: 1000,
      fuelVolumeLiters: 10,
      isFullTank: true,
      createdAt: new Date().toISOString(),
    });

    await db.documents.add({
      id: 'doc_custom_rc',
      vehicleId: userVehicleId,
      title: 'KTM Registration Certificate',
      category: 'rc',
      fileName: 'ktm_rc.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024,
      fileData: 'data:image/jpeg;base64,sample',
      createdAt: new Date().toISOString(),
    });

    expect(await db.vehicles.count()).toBe(3);

    // 3. Remove sample data
    const result = await removeSampleData();
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    // 4. Verify only custom user vehicle, fuel, and document remain
    const remainingVehicles = await db.vehicles.toArray();
    expect(remainingVehicles.length).toBe(1);
    expect(remainingVehicles[0].id).toBe(userVehicleId);

    const remainingFuel = await db.fuelRecords.toArray();
    expect(remainingFuel.length).toBe(1);
    expect(remainingFuel[0].vehicleId).toBe(userVehicleId);

    const remainingDocs = await db.documents.toArray();
    expect(remainingDocs.length).toBe(1);
    expect(remainingDocs[0].vehicleId).toBe(userVehicleId);
  });

  it('should export database to valid JSON (v2)', async () => {
    await seedSampleData();

    const jsonString = await exportAllDataAsJSON();
    expect(typeof jsonString).toBe('string');

    const parsed = JSON.parse(jsonString);
    expect(parsed.appName).toBe('MyRide');
    expect(parsed.version).toBe(2);
    expect(parsed.data.vehicles.length).toBeGreaterThan(0);
    expect(parsed.data.documents).toBeDefined();
    expect(parsed.data.componentWear).toBeDefined();
  });

  it('should restore database correctly from exported JSON', async () => {
    // 1. Seed initial data
    await seedSampleData();
    const jsonString = await exportAllDataAsJSON();

    // 2. Clear DB completely
    await db.vehicles.clear();
    await db.fuelRecords.clear();
    await db.documents.clear();
    await db.componentWear.clear();
    expect(await db.vehicles.count()).toBe(0);

    // 3. Import JSON backup
    const result = await importAllDataFromJSON(jsonString);
    expect(result.success).toBe(true);

    // 4. Verify restored counts
    const restoredVehicles = await db.vehicles.toArray();
    expect(restoredVehicles.length).toBeGreaterThanOrEqual(2);
    const restoredDocs = await db.documents.toArray();
    expect(restoredDocs.length).toBeGreaterThan(0);
  });

  it('should handle invalid JSON import gracefully', async () => {
    const result = await importAllDataFromJSON('invalid json content');
    expect(result.success).toBe(false);
  });

  it('should generate properly formatted CSV exports for fuel, services, and expenses', () => {
    const fuelLogs = [
      {
        id: 'f1',
        vehicleId: 'v1',
        dateTime: '2026-09-01T10:00',
        odometer: 1000,
        amountSpent: 750,
        fuelVolumeLiters: 7.5,
        isFullTank: true,
        costPerLiter: 100,
        stationName: 'Shell',
        notes: 'Full tank fill',
        createdAt: '2026-09-01T10:00:00',
      },
    ];

    const fuelCsv = exportFuelRecordsToCSV(fuelLogs, 'km', 'L');
    expect(fuelCsv).toContain('Date & Time');
    expect(fuelCsv).toContain('Shell');
    expect(fuelCsv).toContain('1000');
    expect(fuelCsv).toContain('750');

    const serviceLogs = [
      {
        id: 's1',
        vehicleId: 'v1',
        dateTime: '2026-09-02T10:00',
        odometer: 1050,
        serviceTypes: ['oil_change' as any],
        totalCost: 1200,
        mechanicOrCenter: 'RE Service Hub',
        notes: '1st Free Service',
        parts: [{ id: 'part_1', name: 'Engine Oil', cost: 800, quantity: 1 }],
        createdAt: '2026-09-02T10:00:00',
      },
    ];

    const serviceCsv = exportServiceRecordsToCSV(serviceLogs, 'km');
    expect(serviceCsv).toContain('Service Categories');
    expect(serviceCsv).toContain('oil change');
    expect(serviceCsv).toContain('RE Service Hub');
    expect(serviceCsv).toContain('1200');

    const expenseLogs = [
      {
        id: 'e1',
        vehicleId: 'v1',
        dateTime: '2026-09-03T10:00',
        category: 'toll' as any,
        amount: 85,
        title: 'Highway Expressway Toll',
        notes: 'Fastag',
        createdAt: '2026-09-03T10:00:00',
      },
    ];

    const expenseCsv = exportExpensesToCSV(expenseLogs);
    expect(expenseCsv).toContain('Category');
    expect(expenseCsv).toContain('Highway Expressway Toll');
    expect(expenseCsv).toContain('85');
  });
});

