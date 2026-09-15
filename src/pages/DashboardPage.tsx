import { useState } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { VehicleCard } from '../components/common/VehicleCard';
import { ReminderBanner } from '../components/common/ReminderBanner';
import { TimelineItem } from '../components/common/TimelineItem';
import { ComponentWearCard } from '../components/common/ComponentWearCard';
import { PredictiveInsightsCard } from '../components/common/PredictiveInsightsCard';
import { StatCard } from '../components/ui/StatCard';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  Fuel,
  Wrench,
  Gauge,
  TrendingUp,
  Receipt,
  Plus,
  Compass,
  ArrowRight,
  Sparkles,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { formatAmount, formatDistance, formatEfficiency, formatCostPerUnit } from '../lib/utils';
import type { Vehicle } from '../types';

interface DashboardPageProps {
  onOpenAddFuel: () => void;
  onOpenAddService: () => void;
  onOpenAddExpense: () => void;
  onOpenAddReminder: () => void;
  onOpenAddVehicle: () => void;
  onOpenDossier: () => void;
  onOpenVault: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onNavigate: (page: string) => void;
}

export function DashboardPage({
  onOpenAddFuel,
  onOpenAddService,
  onOpenAddExpense,
  onOpenAddReminder,
  onOpenAddVehicle,
  onOpenDossier,
  onOpenVault,
  onEditVehicle,
  onNavigate,
}: DashboardPageProps) {
  const { activeVehicle, metrics, recentActivities, settings, vehicles, loadSampleData } = useVehicle();
  const [activityFilter, setActivityFilter] = useState<string>('all');

  if (!activeVehicle || vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground">No vehicle added yet</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add your motorcycle, scooter, or car to start tracking fuel economy, service logs, expenses, and maintenance offline.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 w-full sm:w-auto">
          <Button variant="default" onClick={onOpenAddVehicle} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span>Add Your Vehicle</span>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await loadSampleData();
            }}
            className="gap-1.5 w-full sm:w-auto text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Fleet</span>
          </Button>
        </div>
      </div>
    );
  }

  const filteredActivities = recentActivities.filter(item => {
    if (activityFilter === 'all') return true;
    return item.type === activityFilter;
  });

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Active Vehicle Hero Card */}
      <VehicleCard
        vehicle={activeVehicle}
        onEdit={() => onEditVehicle(activeVehicle)}
      />

      {/* Reminders / Expiry Alerts */}
      <ReminderBanner onAddReminder={onOpenAddReminder} />

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Driven */}
        <StatCard
          title="Distance Driven"
          value={formatDistance(metrics.totalDistanceDriven, settings.distanceUnit)}
          subtitle={`Current: ${metrics.lastOdometer.toLocaleString()} ${settings.distanceUnit}`}
          icon={<Gauge className="w-4 h-4" />}
        />

        {/* Total Spent on Fuel */}
        <StatCard
          title="Fuel Spent"
          value={formatAmount(metrics.totalFuelSpent)}
          subtitle={`${metrics.totalFuelVolume.toFixed(1)} ${settings.fuelVolumeUnit} filled`}
          icon={<Fuel className="w-4 h-4" />}
          onClick={() => onNavigate('fuel')}
        />

        {/* Maintenance / Service Spend */}
        <StatCard
          title="Service Spent"
          value={formatAmount(metrics.totalServiceSpent)}
          subtitle={`${metrics.serviceCount} services • ${metrics.partsReplacedCount} parts`}
          icon={<Wrench className="w-4 h-4" />}
          onClick={() => onNavigate('service')}
        />

        {/* Fuel Economy / Efficiency */}
        <StatCard
          title="Avg Mileage"
          value={formatEfficiency(metrics.averageFuelEfficiency, settings.distanceUnit, settings.fuelVolumeUnit)}
          subtitle={formatCostPerUnit(metrics.overallCostPerKm, settings.distanceUnit)}
          icon={<TrendingUp className="w-4 h-4" />}
          onClick={() => onNavigate('analytics')}
        />
      </div>

      {/* Quick Action Bar */}
      <div className="p-3.5 rounded-lg border border-border bg-card flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Entry & Vault
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAddFuel}
            className="gap-1.5 text-xs h-9 sm:h-8"
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Log Petrol</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAddService}
            className="gap-1.5 text-xs h-9 sm:h-8"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Log Service</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAddExpense}
            className="gap-1.5 text-xs h-9 sm:h-8"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenVault}
            className="gap-1.5 text-xs h-9 sm:h-8"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Document Vault</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenDossier}
            className="gap-1.5 text-xs h-9 sm:h-8"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Digital Dossier</span>
          </Button>
        </div>
      </div>

      {/* Smart Predictive Insights */}
      <PredictiveInsightsCard />

      {/* Wear & Tear Component Life Tracker */}
      <ComponentWearCard />

      {/* Activity Stream Section */}
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <span>Timeline & Logs</span>
              <span className="text-xs font-normal text-muted-foreground">({filteredActivities.length})</span>
            </CardTitle>

            <div className="w-full sm:w-auto">
              <Tabs
                tabs={[
                  { id: 'all', label: 'All' },
                  { id: 'fuel', label: 'Fuel' },
                  { id: 'service', label: 'Service' },
                  { id: 'expense', label: 'Expenses' },
                ]}
                activeTab={activityFilter}
                onChange={setActivityFilter}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-medium text-foreground">No records logged yet</p>
              <p className="text-xs text-muted-foreground">
                Click "Log Petrol" or "Log Service" to start tracking this bike's lifecycle!
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredActivities.slice(0, 10).map(item => (
                <TimelineItem key={item.id} item={item} />
              ))}
            </div>
          )}

          {filteredActivities.length > 10 && (
            <div className="pt-3 border-t border-border text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('fuel')}
                className="text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <span>View all records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
