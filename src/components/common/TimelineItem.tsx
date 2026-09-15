import React from 'react';
import type { ActivityItem, FuelRecord, ServiceRecord, ExpenseRecord } from '../../types';
import { useVehicle } from '../../context/VehicleContext';
import {
  Fuel,
  Wrench,
  Receipt,
  Trash2,
  Calendar,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { formatAmount, formatDistance, formatDateTime, formatEfficiency } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface TimelineItemProps {
  item: ActivityItem;
}

export function TimelineItem({ item }: TimelineItemProps) {
  const { settings, deleteFuelRecord, deleteServiceRecord, deleteExpenseRecord } = useVehicle();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete this ${item.type} record?`)) {
      if (item.type === 'fuel') await deleteFuelRecord(item.raw.id);
      else if (item.type === 'service') await deleteServiceRecord(item.raw.id);
      else if (item.type === 'expense') await deleteExpenseRecord(item.raw.id);
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'fuel':
        return <Fuel className="w-3.5 h-3.5" />;
      case 'service':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'expense':
      default:
        return <Receipt className="w-3.5 h-3.5" />;
    }
  };

  const fuelRaw = item.type === 'fuel' ? (item.raw as FuelRecord) : null;
  const serviceRaw = item.type === 'service' ? (item.raw as ServiceRecord) : null;
  const expenseRaw = item.type === 'expense' ? (item.raw as ExpenseRecord) : null;

  return (
    <div className="relative pl-6 sm:pl-7 pb-5 group last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-2.5 sm:left-3 top-3 bottom-0 w-px bg-border group-last:hidden" />

      {/* Timeline node */}
      <div className="absolute left-0 sm:left-0.5 top-1.5 w-5 h-5 rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground shadow-xs">
        {getIcon()}
      </div>

      {/* Card Content */}
      <div className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate">{item.title}</h4>
              <Badge variant="outline" className="text-[10px] font-medium py-0 px-1.5">
                {item.badge}
              </Badge>
              {fuelRaw?.isFullTank && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Full Tank</Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
          </div>

          {/* Amount & Delete */}
          <div className="flex items-center gap-2 text-right shrink-0">
            <div>
              <span className="text-sm font-bold text-foreground font-mono">
                {formatAmount(item.amount)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted"
              title="Delete record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Additional Details row */}
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5 flex-wrap">
            {item.odometer && (
              <span className="flex items-center gap-1 font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">
                <Gauge className="w-3 h-3" />
                {formatDistance(item.odometer, settings.distanceUnit)}
              </span>
            )}

            {fuelRaw?.calculatedEfficiencyKmpl && (
              <span className="flex items-center gap-1 text-foreground font-medium text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">
                <Sparkles className="w-3 h-3" />
                {formatEfficiency(fuelRaw.calculatedEfficiencyKmpl, settings.distanceUnit, settings.fuelVolumeUnit)}
              </span>
            )}

            {fuelRaw?.distanceDrivenSinceLast && (
              <span className="text-[11px] text-muted-foreground">
                +{formatDistance(fuelRaw.distanceDrivenSinceLast, settings.distanceUnit)} trip
              </span>
            )}

            {serviceRaw?.notes && (
              <span className="text-[11px] text-muted-foreground italic truncate max-w-xs">
                "{serviceRaw.notes}"
              </span>
            )}

            {expenseRaw?.notes && (
              <span className="text-[11px] text-muted-foreground italic truncate max-w-xs">
                "{expenseRaw.notes}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] ml-auto">
            <Calendar className="w-3 h-3" />
            <span>{formatDateTime(item.dateTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
