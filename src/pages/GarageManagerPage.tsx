import React from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Bike,
  Car,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Gauge,
  Fuel,
  ArrowLeft,
  Sparkles,
  Download,
} from 'lucide-react';
import { formatDistance } from '../lib/utils';
import type { Vehicle } from '../types';

interface GarageManagerPageProps {
  onBack: () => void;
  onAddNew: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

export function GarageManagerPage({
  onBack,
  onAddNew,
  onEditVehicle,
}: GarageManagerPageProps) {
  const {
    vehicles,
    activeVehicleId,
    setActiveVehicleId,
    deleteVehicle,
    hasDemoData,
    removeSampleData,
    settings,
    downloadVehicleTransferPackage,
  } = useVehicle();
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
    <div className="max-w-3xl mx-auto space-y-4 pb-32 sm:pb-20">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>

        <Button
          size="sm"
          onClick={onAddNew}
          className="gap-1.5 text-xs h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Vehicle</span>
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Garage & Vehicle Fleet</CardTitle>
              <CardDescription className="text-xs">
                Manage, switch, or configure all bikes and cars in your garage ({vehicles.length})
              </CardDescription>
            </div>
            {hasDemoData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveDemo}
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 h-8 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Demo Fleet</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
          {vehicles.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Bike className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Your Garage is Empty</p>
                <p className="text-xs text-muted-foreground">Add your first motorcycle, scooter, or car</p>
              </div>
              <Button size="sm" onClick={onAddNew} className="gap-1.5 text-xs">
                <Plus className="w-4 h-4" />
                <span>Add Vehicle Now</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map(v => {
                const isActive = v.id === activeVehicleId;
                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-xl border transition-all ${isActive
                        ? 'border-foreground bg-muted/40 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/20'
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
                            {v.make ? `${v.make} ` : ''}{v.model || v.type}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Gauge className="w-3 h-3" />
                              {formatDistance(v.currentOdometer, settings.distanceUnit)}
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
                            downloadVehicleTransferPackage(v.id);
                            success(`Transfer dossier downloaded for ${v.name}`);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Download Ownership Transfer Dossier (.JSON)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEditVehicle(v)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Vehicle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(v)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

