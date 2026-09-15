import React from 'react';
import { useVehicle } from '../context/VehicleContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Printer,
  Wrench,
  Fuel,
  ShieldCheck,
  Calendar,
  Gauge,
  CheckCircle2,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { formatAmount, formatDistance, formatDate, formatEfficiency } from '../lib/utils';
import type { Vehicle } from '../types';

interface ServiceDossierPageProps {
  onBack: () => void;
  vehicle?: Vehicle | null;
}

export function ServiceDossierPage({ onBack, vehicle: propVehicle }: ServiceDossierPageProps) {
  const { activeVehicle, serviceRecords, metrics, settings } = useVehicle();

  const currentVehicle = propVehicle || activeVehicle;
  if (!currentVehicle) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-32 sm:pb-20">
      {/* Top Back Navigation Bar & Print Action (hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
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
          onClick={handlePrint}
          className="gap-1.5 text-xs font-semibold h-8"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </Button>
      </div>

      {/* Dossier Document Container */}
      <Card id="service-dossier-print" className="border-border print:border-none print:shadow-none">
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicle Maintenance Record
                </span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  Verified Local Dossier
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-1">
                {currentVehicle.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentVehicle.make} {currentVehicle.model} {currentVehicle.year ? `(${currentVehicle.year})` : ''} • Plate: <span className="font-mono font-bold text-foreground">{currentVehicle.registrationNumber || 'N/A'}</span>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="text-xs text-muted-foreground">Report Generated</div>
              <div className="text-xs font-mono font-semibold text-foreground">
                {formatDate(new Date().toISOString())}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                Current Odometer: <span className="font-bold text-foreground">{formatDistance(currentVehicle.currentOdometer, settings.distanceUnit)}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Distance Logged
              </span>
              <p className="text-sm sm:text-base font-bold font-mono mt-1 text-foreground">
                {formatDistance(metrics.totalDistanceDriven, settings.distanceUnit)}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Services Done
              </span>
              <p className="text-sm sm:text-base font-bold font-mono mt-1 text-foreground">
                {serviceRecords.length} visits ({metrics.partsReplacedCount} parts)
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Fuel className="w-3 h-3" /> Avg Mileage
              </span>
              <p className="text-sm sm:text-base font-bold font-mono mt-1 text-foreground">
                {formatEfficiency(metrics.averageFuelEfficiency, settings.distanceUnit, settings.fuelVolumeUnit)}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Lifetime Spent
              </span>
              <p className="text-sm sm:text-base font-bold font-mono mt-1 text-foreground">
                {formatAmount(metrics.totalOverallSpent)}
              </p>
            </div>
          </div>

          {/* Detailed Service History Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Service & Repair History ({serviceRecords.length})</span>
              </h3>
            </div>

            {serviceRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                No service records logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <th className="p-2.5 sm:p-3">Date</th>
                      <th className="p-2.5 sm:p-3">Odometer</th>
                      <th className="p-2.5 sm:p-3">Work Performed & Parts</th>
                      <th className="p-2.5 sm:p-3">Workshop</th>
                      <th className="p-2.5 sm:p-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-normal">
                    {serviceRecords.map(record => (
                      <tr key={record.id} className="hover:bg-muted/20">
                        <td className="p-2.5 sm:p-3 whitespace-nowrap font-mono text-[11px]">
                          {formatDate(record.dateTime)}
                        </td>
                        <td className="p-2.5 sm:p-3 whitespace-nowrap font-mono font-semibold">
                          {formatDistance(record.odometer, settings.distanceUnit)}
                        </td>
                        <td className="p-2.5 sm:p-3 space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {record.serviceTypes.map(st => (
                              <Badge key={st} variant="secondary" className="text-[10px] py-0 px-1 capitalize font-normal">
                                {st.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                          {record.parts && record.parts.length > 0 && (
                            <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                              {record.parts.map((part, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <span>• {part.name}</span>
                                  {part.cost ? (
                                    <span className="font-mono text-[10px] text-foreground/80">({formatAmount(part.cost)})</span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}
                          {record.notes && (
                            <p className="text-[11px] italic text-muted-foreground mt-1">
                              Note: {record.notes}
                            </p>
                          )}
                        </td>
                        <td className="p-2.5 sm:p-3 text-muted-foreground">
                          {record.mechanicOrCenter || '--'}
                        </td>
                        <td className="p-2.5 sm:p-3 whitespace-nowrap font-mono font-bold text-right">
                          {formatAmount(record.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Digital Signature / Verification Stamp */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Offline-Verified Record generated by <strong>My Ride PWA</strong></span>
            </div>
            <div className="font-mono text-[11px]">
              VIN / Plate: {currentVehicle.registrationNumber || 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
