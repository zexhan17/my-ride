import {
  LayoutDashboard,
  Fuel,
  Wrench,
  Receipt,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const getActiveTab = (page: string) => {
    if (page === 'fuel' || page === 'add-fuel') return 'fuel';
    if (page === 'service' || page === 'add-service' || page === 'dossier') return 'service';
    if (page === 'expenses' || page === 'add-expense') return 'expenses';
    if (page === 'analytics') return 'analytics';
    return 'dashboard';
  };

  const activeTabId = getActiveTab(currentPage);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'fuel', label: 'Fuel', icon: Fuel },
    { id: 'service', label: 'Service', icon: Wrench },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="grid grid-cols-5 h-14 items-center px-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTabId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex flex-col items-center justify-center h-full py-1 transition-all select-none touch-manipulation active:scale-95 cursor-pointer',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
            >
              <div
                className={cn(
                  'px-3 py-1 rounded-full transition-all flex items-center justify-center',
                  isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4 transition-transform', isActive && 'scale-110')} />
              </div>
              <span className={cn('text-[10px] tracking-tight mt-0.5 leading-tight', isActive ? 'font-bold text-foreground' : 'font-medium')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
