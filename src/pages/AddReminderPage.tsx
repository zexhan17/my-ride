import React, { useState, useEffect } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import type { ReminderType } from '../types';
import { Bell, Gauge, Calendar, ArrowLeft } from 'lucide-react';

interface AddReminderPageProps {
  onBack: () => void;
}

export function AddReminderPage({ onBack }: AddReminderPageProps) {
  const { activeVehicle, addReminder, settings } = useVehicle();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>('odometer');
  const [targetOdometer, setTargetOdometer] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<'service' | 'insurance' | 'puc' | 'tyre_check' | 'other'>('service');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeVehicle) {
      setTitle('Engine Oil & Filter Service');
      setType('odometer');
      const currentOdo = activeVehicle.currentOdometer || 0;
      setTargetOdometer(String(currentOdo + 3000));
      setTargetDate('');
      setCategory('service');
      setNotes('');
    }
  }, [activeVehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle) {
      error('Please select a vehicle first.');
      return;
    }

    if (!title.trim()) {
      error('Please enter a reminder title.');
      return;
    }

    const odoNum = targetOdometer ? parseFloat(targetOdometer) : undefined;

    if (type === 'odometer' && (!odoNum || isNaN(odoNum))) {
      error('Please enter a target odometer value.');
      return;
    }

    if (type === 'date' && !targetDate) {
      error('Please choose a target date.');
      return;
    }

    if (type === 'both' && (!odoNum || !targetDate)) {
      error('Please provide both target odometer and target date.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addReminder({
        vehicleId: activeVehicle.id,
        title: title.trim(),
        type,
        targetOdometer: odoNum,
        targetDate: targetDate || undefined,
        category,
        isCompleted: false,
        notes: notes.trim() || undefined,
      });

      success('Reminder created!', title);
      onBack();
    } catch (err: any) {
      error('Failed to create reminder', err.message);
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
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Create Maintenance Reminder</CardTitle>
              <CardDescription className="text-xs">
                Set an odometer or calendar milestone alert for {activeVehicle?.name || 'vehicle'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Reminder Title *</label>
              <Input
                placeholder="e.g. Next Periodic Oil Change, Chain Lube, PUC Renewal"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Trigger Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Trigger Reminder By</label>
              <Select
                value={type}
                onChange={e => setType(e.target.value as ReminderType)}
                className="h-9 text-xs sm:text-sm"
              >
                <option value="odometer">Odometer (Meter Reading km)</option>
                <option value="date">Specific Date / Calendar</option>
                <option value="both">Whichever Comes First (Odometer or Date)</option>
              </Select>
            </div>

            {/* Odometer target */}
            {(type === 'odometer' || type === 'both') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Target Odometer ({settings.distanceUnit}) *</span>
                  </label>
                  {activeVehicle?.currentOdometer ? (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Current: {activeVehicle.currentOdometer.toLocaleString()} {settings.distanceUnit}
                    </span>
                  ) : null}
                </div>
                <Input
                  type="number"
                  placeholder="e.g. 10000"
                  value={targetOdometer}
                  onChange={e => setTargetOdometer(e.target.value)}
                  className="font-mono"
                  required={type === 'odometer' || type === 'both'}
                />
              </div>
            )}

            {/* Date target */}
            {(type === 'date' || type === 'both') && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Target Due Date *</span>
                </label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  required={type === 'date' || type === 'both'}
                />
              </div>
            )}

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Category</label>
              <Select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="h-9 text-xs sm:text-sm"
              >
                <option value="service">Service / Oil Change</option>
                <option value="insurance">Insurance Policy</option>
                <option value="puc">PUC / Pollution</option>
                <option value="tyre_check">Tyres & Chain</option>
                <option value="other">Other</option>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Notes (Optional)</label>
              <Textarea
                rows={2}
                placeholder="Special instructions or parts to purchase..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
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
                {isSubmitting ? 'Saving...' : 'Set Reminder'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

