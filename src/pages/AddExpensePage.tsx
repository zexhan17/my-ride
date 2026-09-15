import React, { useState, useEffect } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { toDateTimeLocalString } from '../lib/utils';
import type { ExpenseCategory } from '../types';
import { Receipt, Clock, Gauge, Calendar, ShieldCheck, ArrowLeft } from 'lucide-react';

interface AddExpensePageProps {
  onBack: () => void;
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

export function AddExpensePage({ onBack }: AddExpensePageProps) {
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
    if (activeVehicle) {
      setCategory('insurance');
      setTitle('Annual Insurance Renewal');
      setAmount('');
      setDateTime(toDateTimeLocalString());
      setOdometer(activeVehicle.currentOdometer ? String(activeVehicle.currentOdometer) : '');
      setExpiryDate('');
      setCreateReminder(true);
      setNotes('');
    }
  }, [activeVehicle]);

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
      onBack();
    } catch (err: any) {
      error('Failed to log expense', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpiringDoc = category === 'insurance' || category === 'puc';

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
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Log Expense / Bill</CardTitle>
              <CardDescription className="text-xs">
                Record costs, documents, or accessories for {activeVehicle?.name || 'vehicle'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Select */}
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

            {/* Title & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-foreground">Title / Purpose *</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Comprehensive Insurance Policy"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Amount Spent *</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 2100"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="font-mono font-medium"
                  required
                />
              </div>
            </div>

            {/* Date & Meter reading */}
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
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Meter Reading ({settings.distanceUnit}) (Optional)</span>
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 10250"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Document Expiry Date */}
            {isExpiringDoc && (
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Validity & Expiry Notification</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Expiry / Renewal Due Date</label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                  />
                </div>

                {expiryDate && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="createRem"
                      checked={createReminder}
                      onChange={e => setCreateReminder(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-foreground accent-foreground cursor-pointer"
                    />
                    <label htmlFor="createRem" className="text-xs text-muted-foreground cursor-pointer">
                      Automatically create a renewal reminder before expiry
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Notes / Bill Reference</label>
              <Textarea
                placeholder="Policy number, dealer info, warranty terms..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

