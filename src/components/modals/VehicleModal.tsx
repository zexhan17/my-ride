import React, { useState, useEffect } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import type { Vehicle, VehicleType, FuelType } from '../../types';
import { Bike, Car, Fuel, Gauge, Hash, Sparkles } from 'lucide-react';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleToEdit?: Vehicle | null;
}

const COLOR_PRESETS = [
  '#38bdf8', // Sky Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Amber / Gold
  '#10b981', // Emerald Green
  '#06b6d4', // Cyan
  '#64748b', // Slate
  '#1e293b', // Dark Slate
];

export function VehicleModal({ isOpen, onClose, vehicleToEdit }: VehicleModalProps) {
  const { addVehicle, updateVehicle, settings } = useVehicle();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<VehicleType>('bike');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [colorHex, setColorHex] = useState('#38bdf8');
  const [fuelType, setFuelType] = useState<FuelType>('petrol');
  const [tankCapacityLiters, setTankCapacityLiters] = useState('');
  const [initialOdometer, setInitialOdometer] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (vehicleToEdit) {
        setName(vehicleToEdit.name);
        setType(vehicleToEdit.type);
        setMake(vehicleToEdit.make);
        setModel(vehicleToEdit.model);
        setYear(vehicleToEdit.year ? String(vehicleToEdit.year) : '');
        setRegistrationNumber(vehicleToEdit.registrationNumber);
        setColorHex(vehicleToEdit.colorHex || '#38bdf8');
        setFuelType(vehicleToEdit.fuelType);
        setTankCapacityLiters(vehicleToEdit.tankCapacityLiters ? String(vehicleToEdit.tankCapacityLiters) : '');
        setInitialOdometer(String(vehicleToEdit.initialOdometer));
        setCurrentOdometer(String(vehicleToEdit.currentOdometer));
        setPurchaseDate(vehicleToEdit.purchaseDate || '');
      } else {
        // Reset defaults for new vehicle
        setName('');
        setType('bike');
        setMake('');
        setModel('');
        setYear(String(new Date().getFullYear()));
        setRegistrationNumber('');
        setColorHex('#38bdf8');
        setFuelType('petrol');
        setTankCapacityLiters('13');
        setInitialOdometer('0');
        setCurrentOdometer('0');
        setPurchaseDate('');
      }
    }
  }, [isOpen, vehicleToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Please enter a vehicle nickname/name.');
      return;
    }

    const initOdoNum = parseFloat(initialOdometer) || 0;
    const currOdoNum = parseFloat(currentOdometer) || initOdoNum;
    const tankNum = tankCapacityLiters ? parseFloat(tankCapacityLiters) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;

    try {
      setIsSubmitting(true);

      if (vehicleToEdit) {
        await updateVehicle(vehicleToEdit.id, {
          name: name.trim(),
          type,
          make: make.trim(),
          model: model.trim(),
          year: yearNum,
          registrationNumber: registrationNumber.trim().toUpperCase(),
          colorHex,
          fuelType,
          tankCapacityLiters: tankNum,
          initialOdometer: initOdoNum,
          currentOdometer: Math.max(initOdoNum, currOdoNum),
          purchaseDate: purchaseDate || undefined,
        });
        success('Vehicle updated!', name);
      } else {
        await addVehicle({
          name: name.trim(),
          type,
          make: make.trim(),
          model: model.trim(),
          year: yearNum,
          registrationNumber: registrationNumber.trim().toUpperCase(),
          colorHex,
          fuelType,
          tankCapacityLiters: tankNum,
          initialOdometer: initOdoNum,
          currentOdometer: Math.max(initOdoNum, currOdoNum),
          purchaseDate: purchaseDate || undefined,
        });
        success('New vehicle added to your garage!', name);
      }

      onClose();
    } catch (err: any) {
      error('Failed to save vehicle', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
            {type === 'car' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
          </div>
          <span>{vehicleToEdit ? 'Edit Vehicle Profile' : 'Add New Vehicle'}</span>
        </div>
      }
      description={vehicleToEdit ? 'Update bike/vehicle specifications & odometer' : 'Add a motorcycle, scooter, or car to your garage'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nickname / Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Vehicle Nickname / Display Name *</label>
          <Input
            placeholder="e.g. Hunter 350, MT-15 Beast, City Commuter"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Vehicle Type & Color Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Vehicle Type</label>
            <Select
              value={type}
              onChange={e => setType(e.target.value as VehicleType)}
            >
              <option value="bike">Motorcycle / Bike</option>
              <option value="scooter">Scooter / Moped</option>
              <option value="car">Car / Sedan / SUV</option>
              <option value="ev">Electric Vehicle (EV)</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Color Badge</label>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {COLOR_PRESETS.map(hex => (
                <button
                  type="button"
                  key={hex}
                  onClick={() => setColorHex(hex)}
                  className={`w-6 h-6 rounded-full transition-transform ${colorHex === hex ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:scale-110 opacity-80'
                    }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Make, Model & Year */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Make / Brand</label>
            <Input
              placeholder="e.g. Royal Enfield, Yamaha, Honda"
              value={make}
              onChange={e => setMake(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Model</label>
            <Input
              placeholder="e.g. Hunter 350, Duke 390"
              value={model}
              onChange={e => setModel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Manufacturing Year</label>
            <Input
              type="number"
              placeholder="e.g. 2024"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        {/* Registration Number & Fuel Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              <span>License Plate / Registration No.</span>
            </label>
            <Input
              placeholder="e.g. MH 12 AB 1234"
              value={registrationNumber}
              onChange={e => setRegistrationNumber(e.target.value)}
              className="font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Fuel Type</span>
            </label>
            <Select
              value={fuelType}
              onChange={e => setFuelType(e.target.value as FuelType)}
            >
              <option value="petrol">Petrol / Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric (EV)</option>
              <option value="cng">CNG</option>
              <option value="hybrid">Hybrid</option>
            </Select>
          </div>
        </div>

        {/* Tank Capacity & Purchase Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Tank Capacity ({settings.fuelVolumeUnit})</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 13 (Liters)"
              value={tankCapacityLiters}
              onChange={e => setTankCapacityLiters(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Purchase / Delivery Date</label>
            <Input
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
            />
          </div>
        </div>

        {/* Odometer Initial & Current */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-sky-500" />
            <span>Odometer / Mileage Setup ({settings.distanceUnit})</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Purchase / Start Odometer
              </label>
              <Input
                type="number"
                step="any"
                placeholder="0"
                value={initialOdometer}
                onChange={e => setInitialOdometer(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Current Meter Reading
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 5000"
                value={currentOdometer}
                onChange={e => setCurrentOdometer(e.target.value)}
                className="font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="glow" disabled={isSubmitting} className="min-w-[130px]">
            {isSubmitting ? 'Saving...' : vehicleToEdit ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

