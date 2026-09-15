import React, { useState, useEffect } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { toDateTimeLocalString, formatAmount, generateId } from '../lib/utils';
import type { ServiceTypeCategory, ServicePartItem } from '../types';
import { Wrench, Clock, Gauge, Plus, Trash2, Sparkles, Building2, ArrowLeft, Calculator } from 'lucide-react';

interface AddServicePageProps {
  onBack: () => void;
}

const SERVICE_TYPE_OPTIONS: { id: ServiceTypeCategory; label: string }[] = [
  { id: 'general', label: 'General Service' },
  { id: 'oil_change', label: 'Engine Oil & Filter' },
  { id: 'brakes', label: 'Brakes' },
  { id: 'chain_sprocket', label: 'Chain & Sprocket' },
  { id: 'tyres', label: 'Tyres' },
  { id: 'battery', label: 'Battery' },
  { id: 'air_filter', label: 'Air Filter' },
  { id: 'spark_plug', label: 'Spark Plug' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'detailing', label: 'Wash & Detail' },
  { id: 'body_repair', label: 'Body Repair' },
  { id: 'custom', label: 'Other Repair' },
];

export function AddServicePage({ onBack }: AddServicePageProps) {
  const { activeVehicle, addServiceRecord, settings } = useVehicle();
  const { success, error } = useToast();

  const [dateTime, setDateTime] = useState(toDateTimeLocalString());
  const [odometer, setOdometer] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<ServiceTypeCategory[]>(['general', 'oil_change']);
  const [mechanicOrCenter, setMechanicOrCenter] = useState<string>('');
  const [parts, setParts] = useState<ServicePartItem[]>([]);
  const [laborCost, setLaborCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (activeVehicle) {
      setDateTime(toDateTimeLocalString());
      setOdometer(activeVehicle.currentOdometer ? String(activeVehicle.currentOdometer) : '');
      setTotalCost('');
      setSelectedTypes(['general', 'oil_change']);
      setMechanicOrCenter('');
      setParts([]);
      setLaborCost('');
      setNotes('');
    }
  }, [activeVehicle]);

  const toggleType = (type: ServiceTypeCategory) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const addPartRow = () => {
    setParts([...parts, { id: generateId(), name: '', cost: 0 }]);
  };

  const updatePart = (id: string, field: keyof ServicePartItem, value: any) => {
    setParts(parts.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removePartRow = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const calculateSumOfParts = () => {
    return parts.reduce((acc, p) => acc + (Number(p.cost) || 0), 0) + (Number(laborCost) || 0);
  };

  const autoFillTotalFromParts = () => {
    const sum = calculateSumOfParts();
    if (sum > 0) {
      setTotalCost(String(sum));
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
    const costNum = parseFloat(totalCost);

    if (isNaN(odoNum) || odoNum < 0) {
      error('Please enter a valid odometer reading.');
      return;
    }

    if (isNaN(costNum) || costNum < 0) {
      error('Please enter total service cost.');
      return;
    }

    try {
      setIsSubmitting(true);
      const validParts = parts.filter(p => p.name.trim().length > 0);

      await addServiceRecord({
        vehicleId: activeVehicle.id,
        dateTime,
        odometer: odoNum,
        totalCost: costNum,
        serviceTypes: selectedTypes.length > 0 ? selectedTypes : ['general'],
        mechanicOrCenter: mechanicOrCenter.trim() || undefined,
        parts: validParts,
        laborCost: laborCost ? parseFloat(laborCost) : undefined,
        notes: notes.trim() || undefined,
      });

      success('Service record saved!', `Cost: ${costNum} at ${odoNum} ${settings.distanceUnit}`);
      onBack();
    } catch (err: any) {
      error('Failed to save service record', err.message);
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
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">New Service Record</CardTitle>
              <CardDescription className="text-xs">
                Record maintenance work for {activeVehicle?.name || 'vehicle'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date & Time + Odometer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <span>Set Now</span>
                  </button>
                </div>
                <Input
                  type="datetime-local"
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Meter Reading ({settings.distanceUnit}) *</span>
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 10000"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                  className="font-mono"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Service Categories Multi-select Chips */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block">
                Work Done / Categories *
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPE_OPTIONS.map(opt => {
                  const isSelected = selectedTypes.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleType(opt.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all select-none touch-manipulation active:scale-95 cursor-pointer ${isSelected
                        ? 'border-foreground bg-muted text-foreground font-semibold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Cost & Workshop Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Total Spend *</label>
                  {parts.length > 0 && (
                    <button
                      type="button"
                      onClick={autoFillTotalFromParts}
                      className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 touch-manipulation"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Auto-Sum ({formatAmount(calculateSumOfParts())})</span>
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 2400"
                  value={totalCost}
                  onChange={e => setTotalCost(e.target.value)}
                  className="font-mono font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Workshop / Mechanic (Optional)</span>
                </label>
                <Input
                  placeholder="e.g. Authorized Service Center, John Motors"
                  value={mechanicOrCenter}
                  onChange={e => setMechanicOrCenter(e.target.value)}
                />
              </div>
            </div>

            {/* Itemized Parts Breakdown */}
            <div className="space-y-2.5 p-3 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">Itemized Parts & Supplies</p>
                  <p className="text-[11px] text-muted-foreground">List specific replaced parts with costs</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPartRow}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Part</span>
                </Button>
              </div>

              {parts.length > 0 && (
                <div className="space-y-2 pt-1">
                  {parts.map((part, index) => (
                    <div key={part.id || index} className="flex items-center gap-2">
                      <Input
                        placeholder="Part name (e.g. Motul 7100 1.5L)"
                        value={part.name}
                        onChange={e => updatePart(part.id, 'name', e.target.value)}
                        className="h-10 sm:h-9 text-xs sm:text-sm flex-1"
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Cost"
                        value={part.cost || ''}
                        onChange={e => updatePart(part.id, 'cost', parseFloat(e.target.value) || 0)}
                        className="h-10 sm:h-9 text-xs sm:text-sm w-24 sm:w-28 font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePartRow(part.id)}
                        className="h-10 w-10 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive shrink-0"
                        title="Remove part"
                        aria-label="Remove part"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Labor charge */}
              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Labor / Labor Charges:</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={laborCost}
                  onChange={e => setLaborCost(e.target.value)}
                  className="h-10 sm:h-9 text-xs sm:text-sm w-28 sm:w-32 font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Service Notes / Advice</label>
              <Textarea
                placeholder="Mechanic recommendations, parts warranty details, upcoming tasks..."
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
                {isSubmitting ? 'Saving...' : 'Save Service Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

