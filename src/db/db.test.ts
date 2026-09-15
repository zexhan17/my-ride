import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  seedSampleData,
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

