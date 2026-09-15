import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Content Box (Bottom sheet on mobile, centered modal on desktop) */}
      <div
        className={cn(
          'relative z-50 w-full max-h-[88vh] flex flex-col bg-background text-foreground shadow-2xl border border-border sm:rounded-xl rounded-t-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-150',
          {
            'sm:max-w-sm': maxWidth === 'sm',
            'sm:max-w-md': maxWidth === 'md',
            'sm:max-w-lg': maxWidth === 'lg',
            'sm:max-w-xl': maxWidth === 'xl',
            'sm:max-w-2xl': maxWidth === '2xl',
            'sm:max-w-3xl': maxWidth === '3xl',
            'sm:max-w-4xl': maxWidth === '4xl',
          }
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border bg-muted/30">
          <div className="space-y-0.5 pr-3">
            {title && <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground touch-manipulation active:scale-90"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(88vh-110px)] space-y-4 pb-12 sm:pb-6 pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}
