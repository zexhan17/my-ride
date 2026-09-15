import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: 'border-transparent bg-primary text-primary-foreground shadow-xs',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
    outline: 'border-border text-foreground bg-transparent',
    info: 'border-border bg-muted/80 text-foreground',
    success: 'border-border bg-muted/60 text-foreground',
    warning: 'border-border bg-muted/70 text-foreground',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantClasses[variant] || variantClasses.default,
        className
      )}
      {...props}
    />
  );
}
