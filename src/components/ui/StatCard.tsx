import React from 'react';
import { cn } from '../../lib/utils';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  onClick,
}: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative overflow-hidden p-4 sm:p-5 border border-border bg-card transition-all duration-150 group',
        onClick && 'cursor-pointer hover:bg-muted/40 hover:border-foreground/20 active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className="p-2 rounded-lg bg-muted text-foreground/80 flex items-center justify-center border border-border/50 transition-colors group-hover:bg-accent">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex flex-col">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            {subtitle && <span>{subtitle}</span>}
            {trend && (
              <span className="font-medium text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                {trend.value}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
