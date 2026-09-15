import { useState } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  Receipt,
  Plus,
  ShieldCheck,
  Calendar,
  Trash2,
  Search,
  Sparkles,
} from 'lucide-react';
import { formatAmount, formatDateTime, formatDate, getDaysRemaining } from '../lib/utils';
import type { ExpenseRecord } from '../types';

interface ExpensesPageProps {
  onOpenAddExpense: () => void;
}

export function ExpensesPage({ onOpenAddExpense }: ExpensesPageProps) {
  const { expenseRecords, activeVehicle, settings, deleteExpenseRecord } = useVehicle();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeVehicle) return null;

  // Filter records
  const filteredRecords = expenseRecords.filter((e: ExpenseRecord) => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.title.toLowerCase().includes(q) ||
      (e.notes && e.notes.toLowerCase().includes(q)) ||
      String(e.amount).includes(q);
    return matchesCat && matchesSearch;
  });

  // Find latest insurance & PUC documents
  const latestInsurance = expenseRecords
    .filter((e: ExpenseRecord) => e.category === 'insurance' && e.expiryDate)
    .sort((a: ExpenseRecord, b: ExpenseRecord) => new Date(b.expiryDate!).getTime() - new Date(a.expiryDate!).getTime())[0];

  const latestPuc = expenseRecords
    .filter((e: ExpenseRecord) => e.category === 'puc' && e.expiryDate)
    .sort((a: ExpenseRecord, b: ExpenseRecord) => new Date(b.expiryDate!).getTime() - new Date(a.expiryDate!).getTime())[0];

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this expense record?')) {
      await deleteExpenseRecord(id);
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <span>Expenses & Documents</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Insurance, PUC validity, and other costs for {activeVehicle.name}
          </p>
        </div>

        <Button variant="default" onClick={onOpenAddExpense} className="gap-2 shrink-0 h-9">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </Button>
      </div>

      {/* Document Validity Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Insurance Card */}
        <div className="p-4 rounded-lg border border-border bg-card flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-foreground/70 shrink-0" />
              <h3 className="font-semibold text-sm text-foreground">Insurance Policy</h3>
              {latestInsurance?.expiryDate && (
                <Badge
                  variant={getDaysRemaining(latestInsurance.expiryDate).isOverdue ? 'destructive' : 'outline'}
                  className="text-[10px] py-0"
                >
                  {getDaysRemaining(latestInsurance.expiryDate).label}
                </Badge>
              )}
            </div>

            {latestInsurance ? (
              <div>
                <p className="text-xs text-muted-foreground">{latestInsurance.title}</p>
                <p className="text-xs font-mono font-medium text-foreground mt-0.5">
                  Valid till: {formatDate(latestInsurance.expiryDate)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No insurance expiry tracked</p>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAddExpense}
            className="h-8 text-xs shrink-0"
          >
            {latestInsurance ? 'Renew' : 'Add Policy'}
          </Button>
        </div>

        {/* PUC Certificate Card */}
        <div className="p-4 rounded-lg border border-border bg-card flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-foreground/70 shrink-0" />
              <h3 className="font-semibold text-sm text-foreground">PUC Certificate</h3>
              {latestPuc?.expiryDate && (
                <Badge
                  variant={getDaysRemaining(latestPuc.expiryDate).isOverdue ? 'destructive' : 'outline'}
                  className="text-[10px] py-0"
                >
                  {getDaysRemaining(latestPuc.expiryDate).label}
                </Badge>
              )}
            </div>

            {latestPuc ? (
              <div>
                <p className="text-xs text-muted-foreground">{latestPuc.title}</p>
                <p className="text-xs font-mono font-medium text-foreground mt-0.5">
                  Valid till: {formatDate(latestPuc.expiryDate)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No PUC expiry tracked</p>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAddExpense}
            className="h-8 text-xs shrink-0"
          >
            {latestPuc ? 'Renew' : 'Add PUC'}
          </Button>
        </div>
      </div>

      {/* Categories & Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'insurance', label: 'Insurance' },
            { id: 'puc', label: 'PUC' },
            { id: 'accessories', label: 'Accessories' },
            { id: 'wash_clean', label: 'Wash' },
            { id: 'toll', label: 'Tolls' },
            { id: 'fine_challan', label: 'Fines' },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors select-none ${selectedCategory === cat.id
                ? 'bg-foreground text-background font-medium'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Expense List */}
      <Card className="border-border">
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No expenses found</p>
                <p className="text-xs text-muted-foreground">
                  Track tolls, insurance renewals, modifications, washing & paperwork in one place.
                </p>
              </div>
              {!searchQuery && (
                <Button size="sm" variant="outline" onClick={onOpenAddExpense}>
                  Add Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredRecords.map((item: ExpenseRecord) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-foreground truncate">{item.title}</h4>
                      <Badge variant="outline" className="text-[10px] py-0 capitalize">
                        {item.category.replace('_', ' ')}
                      </Badge>
                      {item.expiryDate && (
                        <span className="text-xs text-muted-foreground font-mono">
                          Expires: {formatDate(item.expiryDate)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(item.dateTime)}
                      </span>
                      {item.notes && <span className="italic">"{item.notes}"</span>}
                    </div>
                  </div>

                  {/* Amount & delete */}
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="font-bold text-sm text-foreground font-mono">
                      {formatAmount(item.amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
