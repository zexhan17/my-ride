import React from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Bike,
  Car,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Gauge,
  Fuel,
} from 'lucide-react';
import { formatDistance } from '../../lib/utils';
import type { Vehicle } from '../../types';

interface VehicleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNew: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

export function VehicleManagerModal({
  isOpen,
  onClose,
  onAddNew,
  onEditVehicle,
}: VehicleManagerModalProps) {
  const { vehicles, activeVehicleId, setActiveVehicleId, deleteVehicle, hasDemoData, removeSampleData, settings } = useVehicle();
  const { success, error, info } = useToast();

  const handleDelete = async (vehicle: Vehicle) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${vehicle.name}? This will permanently delete all its fuel records, service history, and expenses.`
      )
    ) {
      await deleteVehicle(vehicle.id);
      success(`Vehicle "${vehicle.name}" deleted.`);
    }
  };

  const handleRemoveDemo = async () => {
    if (
      window.confirm(
        'Remove demo vehicles and all associated demo logs? (Your custom vehicles will not be affected.)'
      )
    ) {
      const res = await removeSampleData();
      if (res.count > 0) {
        success('Sample demo fleet removed successfully!');
      } else {
        info('No demo vehicles found.');
      }
    }
  };

  const getIcon = (type: string) => {
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
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Garage & Vehicle Manager"
      description="Manage, switch, or add multiple bikes and vehicles in your fleet"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Add vehicle top CTA */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Vehicles ({vehicles.length})
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              onAddNew();
            }}
            className="gap-1.5 text-xs text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </Button>
        </div>

        {/* List of vehicles */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {vehicles.map(v => {
            const isActive = v.id === activeVehicleId;
            return (
              <div
                key={v.id}
                className={`p-4 rounded-xl border transition-all ${isActive
                  ? 'border-primary/50 bg-primary/5 shadow-xs'
                  : 'border-border bg-card hover:bg-muted/30'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${v.colorHex || '#38bdf8'}15`,
                        color: v.colorHex || '#38bdf8',
                        borderColor: `${v.colorHex || '#38bdf8'}30`,
                      }}
                    >
                      {getIcon(v.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground truncate">{v.name}</h4>
                        {isActive && (
                          <Badge variant="default" className="text-[10px] py-0 px-1.5 gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {v.registrationNumber || 'No Plate'}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        {v.make} {v.model} {v.year ? `• ${v.year}` : ''}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Gauge className="w-3 h-3" />
                          {formatDistance(v.currentOdometer || v.initialOdometer, settings.distanceUnit)}
                        </span>
                        <span className="flex items-center gap-1 capitalize text-[11px]">
                          <Fuel className="w-3 h-3" />
                          {v.fuelType} {v.tankCapacityLiters ? `(${v.tankCapacityLiters}L)` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setActiveVehicleId(v.id);
                          success(`Switched active vehicle to ${v.name}`);
                        }}
                        className="h-8 text-xs font-semibold"
                      >
                        Select
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        onClose();
                        onEditVehicle(v);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Edit vehicle profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(v)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Delete vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {hasDemoData && (
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Demo fleet active</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveDemo}
              className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5 h-8"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Demo Fleet</span>
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

