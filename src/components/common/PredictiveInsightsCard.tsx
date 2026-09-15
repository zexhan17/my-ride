import React from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  TrendingUp,
  Calendar,
  Compass,
  Gauge,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { formatDate, formatDistance } from '../../lib/utils';

export function PredictiveInsightsCard() {
  const { activeVehicle, predictiveInsights, settings } = useVehicle();

  if (!activeVehicle || predictiveInsights.dailyUsageRateKm <= 0) {
    return null;
  }

  const { dailyUsageRateKm, weeklyUsageRateKm, nextServicePrediction, componentPredictions } = predictiveInsights;

  return (
    <Card className="border-border bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Smart Predictive Insights</span>
          </CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wide">
            Pace: {dailyUsageRateKm} {settings.distanceUnit}/day
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Next Service Prediction Hero Box */}
        {nextServicePrediction && (
          <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                Next Maintenance Forecast
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>{nextServicePrediction.reason}</span>
                <span className="font-mono text-primary font-bold">
                  ({formatDistance(nextServicePrediction.targetOdometer, settings.distanceUnit)})
                </span>
              </h4>
              <p className="text-xs text-muted-foreground">
                At your current pace of ~{weeklyUsageRateKm} {settings.distanceUnit}/week, you are expected to reach this milestone around:
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-muted/40 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
              <div className="text-sm sm:text-base font-bold font-mono text-foreground flex items-center gap-1 sm:justify-end">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(nextServicePrediction.estimatedDate)}</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                ~{nextServicePrediction.daysRemaining} days remaining
              </span>
            </div>
          </div>
        )}

        {/* Component Due Dates Grid */}
        {componentPredictions.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Predicted Component Expirations
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {componentPredictions.slice(0, 4).map((cp, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-foreground truncate">{cp.componentName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {formatDistance(cp.remainingKm, settings.distanceUnit)} left
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-medium text-foreground">{formatDate(cp.estimatedDueDate)}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">in ~{cp.daysRemaining}d</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

