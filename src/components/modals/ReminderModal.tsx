import React, { useState, useEffect } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import type { ReminderType } from '../../types';
import { Bell, Gauge, Calendar, BellOff } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReminderModal({ isOpen, onClose }: ReminderModalProps) {
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
    if (isOpen && activeVehicle) {
      setTitle('Engine Oil & Filter Service');
      setType('odometer');
      const currentOdo = activeVehicle.currentOdometer || 0;
      setTargetOdometer(String(currentOdo + 3000));
      setTargetDate('');
      setCategory('service');
      setNotes('');
    }
  }, [isOpen, activeVehicle]);

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
      onClose();
    } catch (err: any) {
      error('Failed to create reminder', err.message);
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
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Bell className="w-5 h-5" />
          </div>
          <span>Create Maintenance Reminder</span>
        </div>
      }
      description={`Set an odometer or calendar reminder for ${activeVehicle?.name || 'vehicle'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Reminder Title *</label>
          <Input
            placeholder="e.g. Next Periodic Oil Change, Chain Lube, PUC Renewal"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Trigger Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Trigger Reminder By</label>
          <Select
            value={type}
            onChange={e => setType(e.target.value as ReminderType)}
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
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
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
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
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
          <label className="text-xs font-semibold text-foreground">Category</label>
          <Select
            value={category}
            onChange={e => setCategory(e.target.value as any)}
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
          <label className="text-xs font-semibold text-foreground">Notes (Optional)</label>
          <Textarea
            rows={2}
            placeholder="Special instructions or parts to purchase..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Notification Status Hint */}
        <div className="p-2.5 rounded-lg border border-border bg-muted/30 text-[11px] text-muted-foreground flex items-center gap-2">
          {settings.notificationsEnabled && settings.reminderNotifications !== false ? (
            <>
              <Bell className="w-3.5 h-3.5 text-foreground shrink-0" />
              <span>Mobile notifications are active. You'll receive an alert when this milestone is reached.</span>
            </>
          ) : (
            <>
              <BellOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Notifications are currently disabled. Enable them in Settings for mobile alerts.</span>
            </>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="glow" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? 'Saving...' : 'Set Reminder'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

