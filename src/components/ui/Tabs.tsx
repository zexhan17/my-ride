import React from 'react';
import { cn } from '../../lib/utils';

export interface TabsProps {
  tabs: { id: string; label: React.ReactNode; icon?: React.ReactNode; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline' | 'segmented';
}

export function Tabs({ tabs, activeTab, onChange, className, variant = 'segmented' }: TabsProps) {
  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground border border-border/50 no-scrollbar overflow-x-auto max-w-full',
          className
        )}
      >
        <div className="flex items-center gap-1 w-full">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 sm:py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-1 select-none touch-manipulation active:scale-[0.98] cursor-pointer min-h-[36px] sm:min-h-[32px]',
                  isActive
                    ? 'bg-background text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                {tab.icon && <span className="mr-1.5 flex items-center">{tab.icon}</span>}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                      isActive ? 'bg-foreground/10 text-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex border-b border-border space-x-4 overflow-x-auto no-scrollbar', className)}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap',
              isActive
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {tab.icon && <span className="mr-1.5 flex items-center">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs font-bold',
                  isActive ? 'bg-foreground/10 text-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
