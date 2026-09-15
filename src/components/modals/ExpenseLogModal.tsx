import React, { useState, useEffect } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { toDateTimeLocalString } from '../../lib/utils';
import type { ExpenseCategory } from '../../types';
import { Receipt, Clock, Gauge, Calendar, ShieldCheck } from 'lucide-react';

interface ExpenseLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'insurance', label: 'Insurance Policy' },
  { id: 'puc', label: 'PUC / Pollution Certificate' },
  { id: 'accessories', label: 'Accessories & Mods' },
  { id: 'wash_clean', label: 'Washing & Detailing' },
  { id: 'toll', label: 'Toll & Fastag' },
  { id: 'parking', label: 'Parking Fee' },
  { id: 'fine_challan', label: 'Traffic Fine / Challan' },
  { id: 'other', label: 'Other Miscellaneous' },
];

export function ExpenseLogModal({ isOpen, onClose }: ExpenseLogModalProps) {
  const { activeVehicle, addExpenseRecord, addReminder, settings } = useVehicle();
  const { success, error } = useToast();

  const [category, setCategory] = useState<ExpenseCategory>('insurance');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dateTime, setDateTime] = useState(toDateTimeLocalString());
  const [odometer, setOdometer] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [createReminder, setCreateReminder] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && activeVehicle) {
      setCategory('insurance');
      setTitle('Annual Insurance Renewal');
      setAmount('');
      setDateTime(toDateTimeLocalString());
      setOdometer(activeVehicle.currentOdometer ? String(activeVehicle.currentOdometer) : '');
      setExpiryDate('');
      setCreateReminder(true);
      setNotes('');
    }
  }, [isOpen, activeVehicle]);

  const handleCategoryChange = (cat: ExpenseCategory) => {
    setCategory(cat);
    if (cat === 'insurance') setTitle('Annual Insurance Policy');
    else if (cat === 'puc') setTitle('PUC Pollution Certificate');
    else if (cat === 'accessories') setTitle('Riding Gear / Modification');
    else if (cat === 'wash_clean') setTitle('Foam Wash & Polish');
    else if (cat === 'toll') setTitle('Highway Toll');
    else if (cat === 'parking') setTitle('Parking Fee');
    else if (cat === 'fine_challan') setTitle('Traffic Challan');
    else setTitle('Miscellaneous Expense');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle) {
      error('Please select a vehicle first.');
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      error('Please enter a valid amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const odoNum = odometer ? parseFloat(odometer) : undefined;

      await addExpenseRecord({
        vehicleId: activeVehicle.id,
        category,
        title: title.trim(),
        amount: amtNum,
        dateTime,
        odometer: odoNum,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
      });

      if (expiryDate && createReminder) {
        await addReminder({
          vehicleId: activeVehicle.id,
          title: `${title} Expiry`,
          type: 'date',
          targetDate: expiryDate,
          category: category === 'insurance' ? 'insurance' : category === 'puc' ? 'puc' : 'other',
          isCompleted: false,
          notes: `Auto-created reminder for ${title}`,
        });
      }

      success('Expense logged successfully!', `Amount: ${amtNum} for ${title}`);
      onClose();
    } catch (err: any) {
      error('Failed to log expense', err.message);
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
          <Receipt className="w-4 h-4" />
          <span>Add Expense / Document</span>
        </div>
      }
      description={`Record costs or documents for ${activeVehicle?.name || 'vehicle'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Expense Category</label>
          <Select
            value={category}
            onChange={e => handleCategoryChange(e.target.value as ExpenseCategory)}
            required
            className="h-9 text-xs sm:text-sm"
          >
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Title *</label>
          <Input
            type="text"
            placeholder="e.g. Annual Insurance Renewal"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="h-9 text-xs sm:text-sm"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Amount *</label>
          <Input
            type="number"
            step="any"
            placeholder="e.g. 2500"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            className="font-mono font-semibold h-9"
          />
        </div>

        {/* Date & Odometer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Date</span>
            </label>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={e => setDateTime(e.target.value)}
              className="text-xs font-mono h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Odometer ({settings.distanceUnit})</span>
            </label>
            <Input
              type="number"
              placeholder={`e.g. ${activeVehicle?.currentOdometer || ''}`}
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              className="font-mono h-9"
            />
          </div>
        </div>

        {/* Expiry Date (for Insurance/PUC/Documents) */}
        {(category === 'insurance' || category === 'puc' || category === 'other') && (
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-foreground/70" />
              <span className="text-xs font-semibold text-foreground">Validity / Expiry Date</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Next Renewal / Expiry Date</span>
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {expiryDate && (
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createReminder}
                  onChange={e => setCreateReminder(e.target.checked)}
                  className="rounded border-border text-foreground focus:ring-foreground"
                />
                <span>Automatically add renewal alert before expiry</span>
              </label>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Notes (Optional)</label>
          <Textarea
            rows={2}
            placeholder="Policy number, details, or notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-xs sm:text-sm"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-9">
            Cancel
          </Button>
          <Button type="submit" variant="default" disabled={isSubmitting} className="h-9 min-w-[110px]">
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
