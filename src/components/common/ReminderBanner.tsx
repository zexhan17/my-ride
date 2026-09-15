import { useVehicle } from '../../context/VehicleContext';
import { AlertCircle, Calendar, CheckCircle2, Gauge, Plus, Trash2 } from 'lucide-react';
import { getDaysRemaining, formatDistance } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ReminderBannerProps {
  onAddReminder: () => void;
}

export function ReminderBanner({ onAddReminder }: ReminderBannerProps) {
  const { reminders, activeVehicle, toggleReminderComplete, deleteReminder, settings } = useVehicle();

  const activeReminders = reminders.filter(r => !r.isCompleted);
  if (activeReminders.length === 0) {
    return null;
  }

  const currentOdo = activeVehicle?.currentOdometer || 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Active Reminders ({activeReminders.length})</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={onAddReminder} className="h-6 text-xs gap-1">
          <Plus className="w-3 h-3" />
          <span>Add Reminder</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {activeReminders.map(rem => {
          const dateInfo = rem.targetDate ? getDaysRemaining(rem.targetDate) : null;
          const odoRemaining = rem.targetOdometer ? rem.targetOdometer - currentOdo : null;
          const isOdoOverdue = odoRemaining !== null && odoRemaining <= 0;
          const isOverdue = dateInfo?.isOverdue || isOdoOverdue;

          return (
            <div
              key={rem.id}
              className={`p-3.5 rounded-lg border transition-all flex items-start justify-between gap-3 bg-card ${isOverdue ? 'border-destructive/40' : 'border-border'
                }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate">{rem.title}</h4>
                  {isOverdue ? (
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-semibold">
                      Overdue
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                      Due Soon
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  {rem.targetOdometer && (
                    <span className={`flex items-center gap-1 font-mono text-[11px] ${isOdoOverdue ? 'text-destructive font-semibold' : ''}`}>
                      <Gauge className="w-3 h-3" />
                      {odoRemaining !== null && odoRemaining <= 0
                        ? `${Math.abs(odoRemaining).toLocaleString()} ${settings.distanceUnit} past target`
                        : `in ${odoRemaining?.toLocaleString()} ${settings.distanceUnit} (at ${formatDistance(rem.targetOdometer)})`}
                    </span>
                  )}

                  {rem.targetDate && (
                    <span className={`flex items-center gap-1 text-[11px] ${dateInfo?.isOverdue ? 'text-destructive font-semibold' : ''}`}>
                      <Calendar className="w-3 h-3" />
                      {dateInfo?.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleReminderComplete(rem.id)}
                  className="h-7 px-2 text-[11px] gap-1"
                  title="Mark as done"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Done</span>
                </Button>

                <button
                  type="button"
                  onClick={() => deleteReminder(rem.id)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Dismiss reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
