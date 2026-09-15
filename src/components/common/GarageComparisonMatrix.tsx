import React from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Layers,
  Fuel,
  Wrench,
  Gauge,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { formatAmount, formatDistance, formatEfficiency } from '../../lib/utils';

export function GarageComparisonMatrix() {
  const { garageComparison, settings, setActiveVehicleId, activeVehicleId } = useVehicle();

  if (garageComparison.length < 2) {
    return null;
  }

  // Find most economical vehicle (highest mileage or lowest cost/km)
  const sortedByCost = [...garageComparison]
    .filter(g => g.overallCostPerKm > 0)
    .sort((a, b) => a.overallCostPerKm - b.overallCostPerKm);

  const mostEconomicalId = sortedByCost.length > 0 ? sortedByCost[0].vehicle.id : null;

  return (
    <Card className="border-border">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Garage Comparison Matrix</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Side-by-side running cost and fuel efficiency comparison across all {garageComparison.length} vehicles
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wide w-fit">
            {garageComparison.length} Vehicles
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Comparison Table */}
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="p-3">Vehicle</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Avg Mileage</th>
                <th className="p-3">Cost / {settings.distanceUnit}</th>
                <th className="p-3">Fuel Spend</th>
                <th className="p-3">Service Spend</th>
                <th className="p-3 text-right">Lifetime Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {garageComparison.map(item => {
                const isSelected = item.vehicle.id === activeVehicleId;
                const isWinner = item.vehicle.id === mostEconomicalId;

                return (
                  <tr
                    key={item.vehicle.id}
                    onClick={() => setActiveVehicleId(item.vehicle.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/5 font-medium'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border"
                          style={{ backgroundColor: item.vehicle.colorHex || '#38bdf8' }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground truncate">{item.vehicle.name}</span>
                            {isWinner && (
                              <Badge variant="default" className="text-[9px] py-0 px-1 gap-0.5">
                                <Award className="w-2.5 h-2.5" /> Best Cost
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase">
                            {item.vehicle.registrationNumber || item.vehicle.type}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap font-mono text-muted-foreground">
                      {formatDistance(item.totalDistanceDriven, settings.distanceUnit)}
                    </td>

                    <td className="p-3 whitespace-nowrap font-mono font-semibold text-foreground">
                      {formatEfficiency(item.averageFuelEfficiency, settings.distanceUnit, settings.fuelVolumeUnit)}
                    </td>

                    <td className="p-3 whitespace-nowrap font-mono font-bold text-foreground">
                      {item.overallCostPerKm > 0
                        ? `${item.overallCostPerKm.toFixed(2)}/${settings.distanceUnit}`
                        : '--'}
                    </td>

                    <td className="p-3 whitespace-nowrap font-mono text-muted-foreground">
                      {formatAmount(item.totalFuelSpent)}
                    </td>

                    <td className="p-3 whitespace-nowrap font-mono text-muted-foreground">
                      {formatAmount(item.totalServiceSpent)} ({item.serviceCount})
                    </td>

                    <td className="p-3 whitespace-nowrap font-mono font-bold text-right text-foreground">
                      {formatAmount(item.totalOverallSpent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
