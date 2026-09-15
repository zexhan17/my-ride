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
      <div className="grid grid-cols-5 h-13 items-center px-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTabId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex flex-col items-center justify-center h-full py-1 transition-colors select-none',
                isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-md transition-transform',
                  isActive && 'text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
