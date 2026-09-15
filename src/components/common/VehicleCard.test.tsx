import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VehicleCard } from './VehicleCard';
import type { Vehicle } from '../../types';

describe('VehicleCard Component', () => {
  const mockVehicle: Vehicle = {
    id: 'veh_test',
    name: 'Triumph Speed 400',
    type: 'bike',
    make: 'Triumph',
    model: 'Speed 400',
    year: 2024,
    registrationNumber: 'KA 01 TR 4000',
    colorHex: '#ef4444',
    fuelType: 'petrol',
    tankCapacityLiters: 13,
    initialOdometer: 100,
    currentOdometer: 4500,
    purchaseDate: '2024-01-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should display vehicle details, brand, and odometer', () => {
    render(<VehicleCard vehicle={mockVehicle} onEdit={vi.fn()} />);

    expect(screen.getByText('Triumph Speed 400')).toBeInTheDocument();
    expect(screen.getByText('KA 01 TR 4000')).toBeInTheDocument();
    expect(screen.getByText(/4,500 km/i)).toBeInTheDocument();
    expect(screen.getByText(/Triumph Speed 400 \(2024\)/i)).toBeInTheDocument();
  });

  it('should trigger onEdit when Edit Vehicle button is clicked', () => {
    const handleEdit = vi.fn();
    render(<VehicleCard vehicle={mockVehicle} onEdit={handleEdit} />);

    const editBtn = screen.getByRole('button', { name: /edit vehicle/i });
    fireEvent.click(editBtn);

    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
});

