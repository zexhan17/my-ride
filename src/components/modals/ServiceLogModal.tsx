import React, { useState, useEffect } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { toDateTimeLocalString, formatAmount, generateId } from '../../lib/utils';
import type { ServiceTypeCategory, ServicePartItem } from '../../types';
import { Wrench, Clock, Gauge, Plus, Trash2, Sparkles, Building2 } from 'lucide-react';

interface ServiceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function ServiceLogModal({ isOpen, onClose }: ServiceLogModalProps) {
  const { activeVehicle, addServiceRecord, settings } = useVehicle();
  const { success, error } = useToast();

  const [dateTime, setDateTime] = useState(toDateTimeLocalString());
  const [odometer, setOdometer] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<ServiceTypeCategory[]>(['general', 'oil_change']);
  const [mechanicOrCenter, setMechanicOrCenter] = useState<string>('');
  const [parts, setParts] = useState<ServicePartItem[]>([
    { id: generateId(), name: 'Engine Oil Replacement', cost: 1200 },
    { id: generateId(), name: 'Oil Filter O-Ring', cost: 180 },
  ]);
  const [laborCost, setLaborCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && activeVehicle) {
      setDateTime(toDateTimeLocalString());
      setOdometer(activeVehicle.currentOdometer ? String(activeVehicle.currentOdometer) : '');
      setTotalCost('');
      setSelectedTypes(['general', 'oil_change']);
      setMechanicOrCenter('');
      setParts([]);
      setLaborCost('');
      setNotes('');
    }
  }, [isOpen, activeVehicle]);

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
      onClose();
    } catch (err: any) {
      error('Failed to save service record', err.message);
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
          <Wrench className="w-4 h-4" />
          <span>New Service Record</span>
        </div>
      }
      description={`Record maintenance work for ${activeVehicle?.name || 'vehicle'}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
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
                className="text-[11px] text-foreground hover:underline font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Current Time
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Odometer ({settings.distanceUnit}) *</span>
            </label>
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
        </div>

        {/* Service Types Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Service Carried Out</label>
          <div className="flex flex-wrap gap-1.5">
            {SERVICE_TYPE_OPTIONS.map(opt => {
              const isSelected = selectedTypes.includes(opt.id);
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => toggleType(opt.id)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors select-none ${isSelected
                      ? 'bg-foreground text-background border-foreground font-semibold'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Total Cost & Service Center */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Total Bill / Cost *
              </label>
              {parts.length > 0 && (
                <button
                  type="button"
                  onClick={autoFillTotalFromParts}
                  className="text-[11px] text-foreground hover:underline font-medium"
                >
                  Sum from parts: {formatAmount(calculateSumOfParts())}
                </button>
              )}
            </div>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 3500"
              value={totalCost}
              onChange={e => setTotalCost(e.target.value)}
              required
              className="font-mono font-semibold h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Service Center / Workshop</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Authorized Workshop, Speed Care"
              value={mechanicOrCenter}
              onChange={e => setMechanicOrCenter(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Parts Replaced breakdown */}
        <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground uppercase tracking-wider">
              Itemized Parts / Consumables
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPartRow}
              className="h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Part</span>
            </Button>
          </div>

          {parts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              No individual parts added. (Optional)
            </p>
          ) : (
            <div className="space-y-2">
              {parts.map((part) => (
                <div key={part.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Part name (e.g. Engine Oil)"
                    value={part.name}
                    onChange={e => updatePart(part.id, 'name', e.target.value)}
                    className="flex-1 text-xs h-8"
                  />
                  <div className="w-24 shrink-0">
                    <Input
                      type="number"
                      placeholder="Cost"
                      value={part.cost || ''}
                      onChange={e => updatePart(part.id, 'cost', parseFloat(e.target.value) || 0)}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePartRow(part.id)}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Mechanic Advice & Notes (Optional)</label>
          <Textarea
            rows={2}
            placeholder="e.g. Tappets adjusted, brake pads 70% life remaining..."
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
          <Button type="submit" variant="default" disabled={isSubmitting} className="h-9 min-w-[120px]">
            {isSubmitting ? 'Saving...' : 'Save Record'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
