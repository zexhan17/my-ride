import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  seedSampleData,
  removeSampleData,
  exportAllDataAsJSON,
  importAllDataFromJSON,
} from './db';

describe('Dexie Database & Storage Layer', () => {
  beforeEach(async () => {
    await db.vehicles.clear();
    await db.fuelRecords.clear();
    await db.serviceRecords.clear();
    await db.expenseRecords.clear();
    await db.reminders.clear();
    await db.settings.clear();
  });

  it('should seed realistic sample vehicles and logs', async () => {
    await seedSampleData();

    const vehicles = await db.vehicles.toArray();
    const fuel = await db.fuelRecords.toArray();
    const services = await db.serviceRecords.toArray();
    const expenses = await db.expenseRecords.toArray();
    const reminders = await db.reminders.toArray();

    expect(vehicles.length).toBeGreaterThanOrEqual(2);
    expect(fuel.length).toBeGreaterThan(0);
    expect(services.length).toBeGreaterThan(0);
    expect(expenses.length).toBeGreaterThan(0);
    expect(reminders.length).toBeGreaterThan(0);

    const hunter = vehicles.find(v => v.name.includes('Hunter'));
    expect(hunter).toBeDefined();
    expect(hunter?.make).toBe('Royal Enfield');
  });

  it('should remove demo data while preserving user vehicles and records', async () => {
    // 1. Seed demo data
    await seedSampleData();
    expect(await db.vehicles.count()).toBe(2);

    // 2. Add a custom user vehicle
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

    expect(await db.vehicles.count()).toBe(3);

    // 3. Remove sample data
    const result = await removeSampleData();
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    // 4. Verify only custom user vehicle remains
    const remainingVehicles = await db.vehicles.toArray();
    expect(remainingVehicles.length).toBe(1);
    expect(remainingVehicles[0].id).toBe(userVehicleId);

    const remainingFuel = await db.fuelRecords.toArray();
    expect(remainingFuel.length).toBe(1);
    expect(remainingFuel[0].vehicleId).toBe(userVehicleId);
  });

  it('should export database to valid JSON', async () => {
    await seedSampleData();

    const jsonString = await exportAllDataAsJSON();
    expect(typeof jsonString).toBe('string');

    const parsed = JSON.parse(jsonString);
    expect(parsed.appName).toBe('MyRide');
    expect(parsed.version).toBe(1);
    expect(parsed.data.vehicles.length).toBeGreaterThan(0);
  });

  it('should restore database correctly from exported JSON', async () => {
    // 1. Seed initial data
    await seedSampleData();
    const jsonString = await exportAllDataAsJSON();

    // 2. Clear DB completely
    await db.vehicles.clear();
    await db.fuelRecords.clear();
    expect(await db.vehicles.count()).toBe(0);

    // 3. Import JSON backup
    const result = await importAllDataFromJSON(jsonString);
    expect(result.success).toBe(true);

    // 4. Verify restored counts
    const restoredVehicles = await db.vehicles.toArray();
    expect(restoredVehicles.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle invalid JSON import gracefully', async () => {
    const result = await importAllDataFromJSON('invalid json content');
    expect(result.success).toBe(false);
  });
});

