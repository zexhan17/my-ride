import type { Vehicle } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import {
  Bike,
  Car,
  Fuel,
  Gauge,
  Edit2,
  Share2,
  Download,
} from 'lucide-react';
import { formatDistance } from '../../lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: () => void;
}

export function VehicleCard({ vehicle, onEdit }: VehicleCardProps) {
  const { downloadVehicleTransferPackage } = useVehicle();
  const { success } = useToast();

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'car':
        return <Car className="w-5 h-5" />;
      case 'bike':
      case 'scooter':
      default:
        return <Bike className="w-5 h-5" />;
    }
  };

  const handleExportTransfer = async () => {
    await downloadVehicleTransferPackage(vehicle.id);
    success(`Transfer package downloaded for ${vehicle.name}!`);
  };

  const color = vehicle.colorHex || '#38bdf8';

  return (
    <Card className="border-border bg-card">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Vehicle Info Header */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
              {getVehicleTypeIcon(vehicle.type)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate flex items-center gap-2">
                  <span>{vehicle.name}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 ring-2 ring-background"
                    style={{ backgroundColor: color }}
                    title={`Color Badge: ${color}`}
                  />
                </h1>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {vehicle.registrationNumber || 'No Plate'}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                {vehicle.make ? `${vehicle.make} ` : ''}{vehicle.model || vehicle.type}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTransfer}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Download full history package for selling / transfer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Transfer Dossier</span>
            </Button>

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
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 border-t border-border">
          {/* Current Odometer */}
          <div className="p-2.5 rounded-md bg-muted/40 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>Current Meter</span>
            </p>
            <p className="text-sm sm:text-base font-semibold text-foreground font-mono mt-0.5 truncate">
              {formatDistance(vehicle.currentOdometer || 0)}
            </p>
          </div>

          {/* Fuel Type & Tank */}
          <div className="p-2.5 rounded-md bg-muted/40 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Fuel className="w-3 h-3" />
              <span>Fuel & Tank</span>
            </p>
            <p className="text-sm font-medium text-foreground capitalize mt-0.5 truncate">
              {vehicle.fuelType} {vehicle.tankCapacityLiters ? `(${vehicle.tankCapacityLiters}L)` : ''}
            </p>
          </div>

          {/* Make & Model */}
          <div className="p-2.5 rounded-md bg-muted/40 border border-border/50 col-span-2 sm:col-span-1">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Bike className="w-3 h-3" />
              <span>Specification</span>
            </p>
            <p className="text-sm font-medium text-foreground mt-0.5 truncate">
              {vehicle.make} {vehicle.model || 'Standard'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
