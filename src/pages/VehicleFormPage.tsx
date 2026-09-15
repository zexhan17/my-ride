import React, { useState, useEffect } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import type { Vehicle, VehicleType, FuelType } from '../types';
import { Bike, Car, Fuel, Gauge, Hash, ArrowLeft } from 'lucide-react';

interface VehicleFormPageProps {
  vehicleToEdit?: Vehicle | null;
  onBack: () => void;
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

export function VehicleFormPage({ vehicleToEdit, onBack }: VehicleFormPageProps) {
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
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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
      setCurrentOdometer(String(vehicleToEdit.currentOdometer));
      setPurchaseDate(vehicleToEdit.purchaseDate || '');
    } else {
      setName('');
      setType('bike');
      setMake('');
      setModel('');
      setYear(String(new Date().getFullYear()));
      setRegistrationNumber('');
      setColorHex('#38bdf8');
      setFuelType('petrol');
      setTankCapacityLiters('13');
      setCurrentOdometer('0');
      setPurchaseDate('');
    }
  }, [vehicleToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Please enter a vehicle nickname/name.');
      return;
    }

    const currOdoNum = parseFloat(currentOdometer) || 0;
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
          initialOdometer: vehicleToEdit.initialOdometer ?? 0,
          currentOdometer: currOdoNum,
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
          initialOdometer: 0,
          currentOdometer: currOdoNum,
          purchaseDate: purchaseDate || undefined,
        });
        success('New vehicle added to your garage!', name);
      }

      onBack();
    } catch (err: any) {
      error('Failed to save vehicle', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-32 sm:pb-20">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              {type === 'car' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                {vehicleToEdit ? 'Edit Vehicle Profile' : 'Add New Vehicle'}
              </CardTitle>
              <CardDescription className="text-xs">
                {vehicleToEdit
                  ? 'Update vehicle specifications & meter reading'
                  : 'Add a motorcycle, scooter, or car to your garage fleet'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nickname / Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Vehicle Nickname / Display Name *
              </label>
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
                <label className="text-xs font-medium text-foreground">Vehicle Type</label>
                <Select
                  value={type}
                  onChange={e => setType(e.target.value as VehicleType)}
                  className="h-9 text-xs sm:text-sm"
                >
                  <option value="bike">Motorcycle / Bike</option>
                  <option value="scooter">Scooter / Moped</option>
                  <option value="car">Car / Sedan / SUV</option>
                  <option value="ev">Electric Vehicle (EV)</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Color Badge</label>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {COLOR_PRESETS.map(hex => (
                    <button
                      type="button"
                      key={hex}
                      onClick={() => setColorHex(hex)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        colorHex === hex
                          ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'hover:scale-110 opacity-80'
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
                <label className="text-xs font-medium text-foreground">Make / Brand</label>
                <Input
                  placeholder="e.g. Royal Enfield, Yamaha, Honda"
                  value={make}
                  onChange={e => setMake(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Model</label>
                <Input
                  placeholder="e.g. Hunter 350, Duke 390"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Manufacturing Year</label>
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
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
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
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Fuel Type</span>
                </label>
                <Select
                  value={fuelType}
                  onChange={e => setFuelType(e.target.value as FuelType)}
                  className="h-9 text-xs sm:text-sm"
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
                <label className="text-xs font-medium text-foreground">
                  Tank Capacity ({settings.fuelVolumeUnit})
                </label>
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
                <label className="text-xs font-medium text-foreground">Purchase / Delivery Date</label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            {/* Current Odometer */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Current Meter Reading ({settings.distanceUnit}) *</span>
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 5000"
                value={currentOdometer}
                onChange={e => setCurrentOdometer(e.target.value)}
                className="font-mono font-medium"
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? 'Saving...' : vehicleToEdit ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
