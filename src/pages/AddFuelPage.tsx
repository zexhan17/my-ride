import React, { useState, useEffect } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { toDateTimeLocalString } from '../lib/utils';
import { Fuel, Clock, ArrowLeft, Sparkles, MapPin, Gauge } from 'lucide-react';

interface AddFuelPageProps {
  onBack: () => void;
}

export function AddFuelPage({ onBack }: AddFuelPageProps) {
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
    if (activeVehicle) {
      setDateTime(toDateTimeLocalString());
      setOdometer(activeVehicle.currentOdometer ? String(activeVehicle.currentOdometer) : '');
      setAmountSpent('');
      setFuelVolumeLiters('');
      setPricePerLiter('');
      setIsFullTank(true);
      setStationName('');
      setNotes('');
    }
  }, [activeVehicle]);

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
      onBack();
    } catch (err: any) {
      error('Failed to log fuel record', err.message);
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
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Log Petrol Fill</CardTitle>
              <CardDescription className="text-xs">
                Record fill-up details for {activeVehicle?.name || 'vehicle'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date & Time with "Now" shortcut */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Date & Time</span>
                </label>
                <button
                  type="button"
                  onClick={setNow}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Set to Current Time</span>
                </button>
              </div>
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={e => setDateTime(e.target.value)}
                required
              />
            </div>

            {/* Odometer Reading */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Current Meter Reading ({settings.distanceUnit}) *</span>
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 5420"
                value={odometer}
                onChange={e => setOdometer(e.target.value)}
                className="font-mono"
                required
                autoFocus
              />
            </div>

            {/* Spend & Volume Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Amount Spent *
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 500"
                  value={amountSpent}
                  onChange={e => handleAmountChange(e.target.value)}
                  className="font-mono font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Volume ({settings.fuelVolumeUnit})
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 4.8"
                  value={fuelVolumeLiters}
                  onChange={e => handleVolumeChange(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Rate & Station Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Price per {settings.fuelVolumeUnit}
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 104.2"
                  value={pricePerLiter}
                  onChange={e => handlePricePerLiterChange(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Station / Pump Name</span>
                </label>
                <Input
                  placeholder="e.g. Shell, IndianOil, HP"
                  value={stationName}
                  onChange={e => setStationName(e.target.value)}
                />
              </div>
            </div>

            {/* Full Tank Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">Filled Full Tank?</p>
                <p className="text-[11px] text-muted-foreground">
                  Required for precise fuel efficiency & mileage calculation
                </p>
              </div>
              <input
                type="checkbox"
                checked={isFullTank}
                onChange={e => setIsFullTank(e.target.checked)}
                className="w-4 h-4 rounded border-border text-foreground focus:ring-ring cursor-pointer accent-foreground"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Notes (Optional)</label>
              <Textarea
                placeholder="Trip details, fuel quality / additive..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 sm:h-9 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto sm:min-w-[130px] h-11 sm:h-9 text-xs sm:text-sm font-semibold"
              >
                {isSubmitting ? 'Saving...' : 'Save Fuel Log'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

