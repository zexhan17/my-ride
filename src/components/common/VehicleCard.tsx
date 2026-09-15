import type { Vehicle } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Bike,
  Car,
  Fuel,
  Gauge,
  Calendar,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { formatDistance, formatDate } from '../../lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: () => void;
}

export function VehicleCard({ vehicle, onEdit }: VehicleCardProps) {
  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'car':
        return <Car className="w-4 h-4" />;
      case 'bike':
      case 'scooter':
      default:
        return <Bike className="w-4 h-4" />;
    }
  };

  return (
    <Card className="relative overflow-hidden border-border bg-card">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Vehicle Info Header */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground shrink-0">
              {getVehicleTypeIcon(vehicle.type)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                  {vehicle.name}
                </h1>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {vehicle.registrationNumber || 'No Plate'}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
              </p>
            </div>
          </div>

          {/* Edit action */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 gap-1.5 text-xs"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Vehicle</span>
            </Button>
          </div>
        </div>

        {/* Live Odometer & Specs Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-border">
          {/* Current Odometer */}
          <div className="p-2.5 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>Odometer</span>
            </p>
            <p className="text-sm sm:text-base font-semibold text-foreground font-mono mt-0.5 truncate">
              {formatDistance(vehicle.currentOdometer || vehicle.initialOdometer || 0)}
            </p>
          </div>

          {/* Fuel Type & Tank */}
          <div className="p-2.5 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Fuel className="w-3 h-3" />
              <span>Fuel & Tank</span>
            </p>
            <p className="text-sm font-medium text-foreground capitalize mt-0.5 truncate">
              {vehicle.fuelType} {vehicle.tankCapacityLiters ? `(${vehicle.tankCapacityLiters}L)` : ''}
            </p>
          </div>

          {/* Purchase Date */}
          <div className="p-2.5 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Purchased</span>
            </p>
            <p className="text-sm font-medium text-foreground mt-0.5 truncate">
              {vehicle.purchaseDate ? formatDate(vehicle.purchaseDate) : '--'}
            </p>
          </div>

          {/* Starting Km */}
          <div className="p-2.5 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Start Odo</span>
            </p>
            <p className="text-sm font-medium text-foreground font-mono mt-0.5 truncate">
              {formatDistance(vehicle.initialOdometer || 0)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
