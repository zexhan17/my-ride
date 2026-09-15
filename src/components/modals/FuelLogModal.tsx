import React, { useState, useEffect } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Input';
import { toDateTimeLocalString } from '../../lib/utils';
import { Fuel, Clock, Gauge, MapPin, Sparkles } from 'lucide-react';

interface FuelLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FuelLogModal({ isOpen, onClose }: FuelLogModalProps) {
  const { activeVehicle, addFuelRecord, settings } = useVehicle();
  const { success, error } = useToast();

  const [dateTime, setDateTime] = useState(toDateTimeLocalString());
  const [odometer, setOdometer] = useState<string>('');
  const [amountSpent, setAmountSpent] = useState<string>('');
  const [fuelVolumeLiters, setFuelVolumeLiters] = useState<string>('');
  const [pricePerLiter, setPricePerLiter] = useState<string>('');
  const [isFullTank, setIsFullTank] = useState<boolean>(true);
  const [stationName, setStationName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && activeVehicle) {
      setDateTime(toDateTimeLocalString());
      setOdometer(activeVehicle.currentOdometer ? String(activeVehicle.currentOdometer) : '');
      setAmountSpent('');
      setFuelVolumeLiters('');
      setPricePerLiter('');
      setIsFullTank(true);
      setStationName('');
      setNotes('');
    }
  }, [isOpen, activeVehicle]);

  // Auto calculate Price Per Liter if Amount & Liters are given
  const handleAmountChange = (val: string) => {
    setAmountSpent(val);
    const amt = parseFloat(val);
    const lit = parseFloat(fuelVolumeLiters);
    if (amt > 0 && lit > 0) {
      setPricePerLiter((amt / lit).toFixed(2));
    }
  };

  const handleVolumeChange = (val: string) => {
    setFuelVolumeLiters(val);
    const lit = parseFloat(val);
    const amt = parseFloat(amountSpent);
    if (amt > 0 && lit > 0) {
      setPricePerLiter((amt / lit).toFixed(2));
    }
  };

  const handlePricePerLiterChange = (val: string) => {
    setPricePerLiter(val);
    const ppl = parseFloat(val);
    const amt = parseFloat(amountSpent);
    if (amt > 0 && ppl > 0) {
      setFuelVolumeLiters((amt / ppl).toFixed(2));
    }
  };

  const setNow = () => {
    setDateTime(toDateTimeLocalString(new Date()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle) {
      error('Please select a vehicle first.');
      return;
    }

    const odoNum = parseFloat(odometer);
    const amtNum = parseFloat(amountSpent);
    const volNum = fuelVolumeLiters ? parseFloat(fuelVolumeLiters) : undefined;
    const pplNum = pricePerLiter ? parseFloat(pricePerLiter) : undefined;

    if (isNaN(odoNum) || odoNum < 0) {
      error('Please enter a valid meter/odometer reading.');
      return;
    }

    if (isNaN(amtNum) || amtNum <= 0) {
      error('Please enter the amount spent on fuel.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addFuelRecord({
        vehicleId: activeVehicle.id,
        dateTime,
        odometer: odoNum,
        amountSpent: amtNum,
        fuelVolumeLiters: volNum,
        pricePerLiter: pplNum,
        isFullTank,
        stationName: stationName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      success('Petrol fill logged successfully!', `Amount: ${amtNum} at ${odoNum} ${settings.distanceUnit}`);
      onClose();
    } catch (err: any) {
      error('Failed to log fuel record', err.message);
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
          <Fuel className="w-4 h-4" />
          <span>Log Petrol Fill</span>
        </div>
      }
      description={`Record fuel fill-up for ${activeVehicle?.name || 'vehicle'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Date & Time with "Now" button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Date & Time</span>
            </label>
            <button
              type="button"
              onClick={setNow}
              className="text-[11px] text-foreground hover:underline font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Set to Current Time
            </button>
          </div>
          <Input
            type="datetime-local"
            value={dateTime}
            onChange={e => setDateTime(e.target.value)}
            required
            className="font-mono text-xs h-9"
          />
        </div>

        {/* Odometer / Meter Reading */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Meter Reading ({settings.distanceUnit}) *</span>
            </label>
            {activeVehicle?.currentOdometer ? (
              <span className="text-[11px] text-muted-foreground font-mono">
                Current: {activeVehicle.currentOdometer.toLocaleString()} {settings.distanceUnit}
              </span>
            ) : null}
          </div>
          <Input
            type="number"
            step="any"
            placeholder={`e.g. ${activeVehicle?.currentOdometer || 5000}`}
            value={odometer}
            onChange={e => setOdometer(e.target.value)}
            required
            className="font-mono h-9"
          />
        </div>

        {/* Amount Spent & Fuel Liters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Amount Spent */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Amount Spent *
            </label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 1000"
              value={amountSpent}
              onChange={e => handleAmountChange(e.target.value)}
              required
              className="font-mono font-semibold h-9"
            />
          </div>

          {/* Liters Filled */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Fuel Volume ({settings.fuelVolumeUnit})
            </label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 9.5"
              value={fuelVolumeLiters}
              onChange={e => handleVolumeChange(e.target.value)}
              className="font-mono h-9"
              rightElement={<span className="text-xs text-muted-foreground">{settings.fuelVolumeUnit}</span>}
            />
          </div>
        </div>

        {/* Price Per Liter & Full Tank Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Price / {settings.fuelVolumeUnit}
            </label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 104.50"
              value={pricePerLiter}
              onChange={e => handlePricePerLiterChange(e.target.value)}
              className="font-mono text-xs h-9"
            />
          </div>

          <div className="pt-2 sm:pt-5">
            <label className="flex items-center gap-2.5 p-2 rounded-md border border-border bg-muted/40 cursor-pointer hover:bg-muted/70 select-none">
              <input
                type="checkbox"
                checked={isFullTank}
                onChange={e => setIsFullTank(e.target.checked)}
                className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground"
              />
              <div>
                <p className="text-xs font-medium text-foreground">Full Tank Fill-up</p>
                <p className="text-[10px] text-muted-foreground">Calculates {settings.distanceUnit}/{settings.fuelVolumeUnit} mileage</p>
              </div>
            </label>
          </div>
        </div>

        {/* Fuel Station */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Petrol Station / Location (Optional)</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Shell Expressway Station"
            value={stationName}
            onChange={e => setStationName(e.target.value)}
            className="h-9 text-xs sm:text-sm"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Notes (Optional)</label>
          <Textarea
            rows={2}
            placeholder="e.g. High octane, tyre pressure set to 32 psi..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-xs sm:text-sm"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-9">
            Cancel
          </Button>
          <Button type="submit" variant="default" disabled={isSubmitting} className="h-9 min-w-[110px]">
            {isSubmitting ? 'Saving...' : 'Save Record'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
