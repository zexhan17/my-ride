import { useState, useRef, useEffect } from 'react';
import { Plus, Fuel, Wrench, Receipt, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface QuickActionFABProps {
  onAddFuel: () => void;
  onAddService: () => void;
  onAddExpense: () => void;
}

export function QuickActionFAB({
  onAddFuel,
  onAddService,
  onAddExpense,
}: QuickActionFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={fabRef} className="fixed bottom-20 md:bottom-8 right-5 z-40 flex flex-col items-end">
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs -z-10 animate-in fade-in"
        />
      )}

      {/* Popout Action Options */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2 mb-3 animate-in slide-in-from-bottom-3 duration-150">
          {/* Quick Expense */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAddExpense();
            }}
            className="flex items-center gap-2.5 bg-popover text-popover-foreground px-3.5 py-2 rounded-lg shadow-md border border-border hover:bg-muted transition-colors active:scale-95"
          >
            <span className="text-xs font-medium">Add Expense</span>
            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-foreground">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Quick Service */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAddService();
            }}
            className="flex items-center gap-2.5 bg-popover text-popover-foreground px-3.5 py-2 rounded-lg shadow-md border border-border hover:bg-muted transition-colors active:scale-95"
          >
            <span className="text-xs font-medium">Log Service</span>
            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-foreground">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Quick Fuel */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAddFuel();
            }}
            className="flex items-center gap-2.5 bg-popover text-popover-foreground px-3.5 py-2 rounded-lg shadow-md border border-border hover:bg-muted transition-colors active:scale-95"
          >
            <span className="text-xs font-medium">Log Petrol Fill</span>
            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-foreground">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Main Trigger FAB */}
      <Button
        variant="default"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-12 h-12 rounded-full shadow-lg p-0 flex items-center justify-center transition-all duration-200',
          isOpen && 'rotate-90 bg-destructive text-destructive-foreground hover:bg-destructive/90'
        )}
        aria-label="Add new record"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </Button>
    </div>
  );
}
