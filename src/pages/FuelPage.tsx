import { useState } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  Fuel,
  Plus,
  Gauge,
  Sparkles,
  Calendar,
  MapPin,
  Trash2,
  TrendingUp,
  Search,
  Download,
} from 'lucide-react';
import { formatAmount, formatDistance, formatDateTime, formatEfficiency } from '../lib/utils';
import type { FuelRecord } from '../types';

interface FuelPageProps {
  onOpenAddFuel: () => void;
}

export function FuelPage({ onOpenAddFuel }: FuelPageProps) {
  const { fuelRecords, activeVehicle, settings, metrics, deleteFuelRecord, exportFuelCSV } = useVehicle();
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeVehicle) return null;

  const filteredRecords = fuelRecords.filter((f: FuelRecord) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.stationName && f.stationName.toLowerCase().includes(q)) ||
      (f.notes && f.notes.toLowerCase().includes(q)) ||
      String(f.odometer).includes(q) ||
      String(f.amountSpent).includes(q)
    );
  });

  const bestEfficiency = fuelRecords.reduce((max: number, f: FuelRecord) => {
    if (f.calculatedEfficiencyKmpl && f.calculatedEfficiencyKmpl > max) {
      return f.calculatedEfficiencyKmpl;
    }
    return max;
  }, 0);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this fuel record?')) {
      await deleteFuelRecord(id);
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            <span>Fuel Logs & Mileage</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Petrol fill-ups and consumption analytics for {activeVehicle.name}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {fuelRecords.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportFuelCSV}
              className="gap-1.5 text-xs h-9"
              title="Download fuel logs spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          )}

          <Button variant="default" onClick={onOpenAddFuel} className="gap-2 shrink-0 h-9">
            <Plus className="w-3.5 h-3.5" />
            <span>Log Petrol Fill</span>
          </Button>
        </div>
      </div>

      {/* Fuel Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Total Fuel Spent</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-1">
            {formatAmount(metrics.totalFuelSpent)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {metrics.totalFuelVolume.toFixed(1)} {settings.fuelVolumeUnit} total
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Avg Fuel Economy</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-1">
            {formatEfficiency(metrics.averageFuelEfficiency, settings.distanceUnit, settings.fuelVolumeUnit)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Overall mileage
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Best Mileage</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-1">
            {bestEfficiency > 0 ? formatEfficiency(bestEfficiency, settings.distanceUnit, settings.fuelVolumeUnit) : '--'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Peak efficiency</p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Cost / {settings.distanceUnit}</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-1">
            {metrics.fuelCostPerKm > 0 ? `${metrics.fuelCostPerKm.toFixed(2)} / ${settings.distanceUnit}` : '--'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Running cost</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search logs by petrol pump, notes, or meter reading..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="text-xs sm:text-sm h-9"
          />
        </div>
      </div>

      {/* Logs List */}
      <Card className="border-border">
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <Fuel className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No fuel records found</p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? 'Try clearing your search query' : 'Log your first petrol fill to start tracking mileage!'}
                </p>
              </div>
              {!searchQuery && (
                <Button size="sm" variant="outline" onClick={onOpenAddFuel}>
                  Log Fill-up
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredRecords.map((record: FuelRecord) => (
                <div
                  key={record.id}
                  className="p-4 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-foreground font-mono">
                        {formatAmount(record.amountSpent)}
                      </span>
                      {record.isFullTank && (
                        <Badge variant="outline" className="text-[10px] py-0">
                          Full Tank
                        </Badge>
                      )}
                      {record.fuelVolumeLiters && (
                        <span className="text-xs text-muted-foreground font-mono">
                          • {record.fuelVolumeLiters} {settings.fuelVolumeUnit}
                        </span>
                      )}
                      {record.pricePerLiter && (
                        <span className="text-xs text-muted-foreground font-mono">
                          (@ {record.pricePerLiter}/{settings.fuelVolumeUnit})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">
                        <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDistance(record.odometer, settings.distanceUnit)}
                      </span>

                      {record.distanceDrivenSinceLast && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          +{formatDistance(record.distanceDrivenSinceLast, settings.distanceUnit)} trip
                        </span>
                      )}

                      {record.calculatedEfficiencyKmpl && (
                        <span className="flex items-center gap-1 text-foreground font-medium text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">
                          <Sparkles className="w-3 h-3" />
                          {formatEfficiency(record.calculatedEfficiencyKmpl, settings.distanceUnit, settings.fuelVolumeUnit)}
                        </span>
                      )}

                      {record.costPerKm && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {record.costPerKm.toFixed(2)}/{settings.distanceUnit}
                        </span>
                      )}
                    </div>

                    {(record.stationName || record.notes) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        {record.stationName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>{record.stationName}</span>
                          </span>
                        )}
                        {record.notes && <span className="italic">"{record.notes}"</span>}
                      </div>
                    )}
                  </div>

                  {/* Right info: Date & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 text-right shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 inline sm:hidden" />
                        {formatDateTime(record.dateTime)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(record.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted"
                      title="Delete fuel log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
