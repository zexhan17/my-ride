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
    <div ref={fabRef} className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 flex flex-col items-end">
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs -z-10 animate-in fade-in duration-150"
        />
      )}

      {/* Popout Action Options */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 mb-3 animate-in slide-in-from-bottom-3 duration-150">
          {/* Quick Expense */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAddExpense();
            }}
            className="flex items-center gap-3 bg-popover text-popover-foreground px-4 py-2.5 rounded-xl shadow-xl border border-border hover:bg-muted transition-all touch-manipulation active:scale-95 cursor-pointer"
          >
            <span className="text-xs font-semibold">Add Expense</span>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </button>

          {/* Quick Service */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAddService();
            }}
            className="flex items-center gap-3 bg-popover text-popover-foreground px-4 py-2.5 rounded-xl shadow-xl border border-border hover:bg-muted transition-all touch-manipulation active:scale-95 cursor-pointer"
          >
            <span className="text-xs font-semibold">Log Service</span>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
          </button>

          {/* Quick Fuel */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAddFuel();
            }}
            className="flex items-center gap-3 bg-popover text-popover-foreground px-4 py-2.5 rounded-xl shadow-xl border border-border hover:bg-muted transition-all touch-manipulation active:scale-95 cursor-pointer"
          >
            <span className="text-xs font-semibold">Log Petrol Fill</span>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
              <Fuel className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Main Trigger FAB */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-13 h-13 rounded-full shadow-2xl p-0 flex items-center justify-center transition-all duration-200 touch-manipulation active:scale-90 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90',
          isOpen && 'rotate-90 bg-destructive text-destructive-foreground hover:bg-destructive/90'
        )}
        aria-label={isOpen ? 'Close quick menu' : 'Open quick menu'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
