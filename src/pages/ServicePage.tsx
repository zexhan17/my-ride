import { useState } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { ComponentWearCard } from '../components/common/ComponentWearCard';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  Wrench,
  Plus,
  Gauge,
  Calendar,
  Building2,
  Trash2,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Search,
  FileText,
  Download,
} from 'lucide-react';
import { formatAmount, formatDistance, formatDateTime } from '../lib/utils';
import type { ServiceRecord, ServicePartItem } from '../types';

interface ServicePageProps {
  onOpenAddService: () => void;
  onOpenDossier?: () => void;
}

export function ServicePage({ onOpenAddService, onOpenDossier }: ServicePageProps) {
  const { serviceRecords, activeVehicle, settings, metrics, deleteServiceRecord, exportServiceCSV } = useVehicle();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  if (!activeVehicle) return null;

  const filteredRecords = serviceRecords.filter((s: ServiceRecord) => {
    const q = searchQuery.toLowerCase();
    const typeNames = s.serviceTypes.map(t => t.replace('_', ' ')).join(' ').toLowerCase();
    const partsNames = s.parts ? s.parts.map(p => p.name.toLowerCase()).join(' ') : '';
    return (
      typeNames.includes(q) ||
      partsNames.includes(q) ||
      (s.mechanicOrCenter && s.mechanicOrCenter.toLowerCase().includes(q)) ||
      (s.notes && s.notes.toLowerCase().includes(q)) ||
      String(s.odometer).includes(q) ||
      String(s.totalCost).includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this service record?')) {
      await deleteServiceRecord(id);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            <span>Service & Maintenance</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Maintenance logs and parts breakdown for {activeVehicle.name}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDossier && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDossier}
              className="gap-1.5 text-xs h-9"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Digital Dossier (PDF)</span>
            </Button>
          )}

          {serviceRecords.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportServiceCSV}
              className="gap-1.5 text-xs h-9"
              title="Download service history spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          )}

          <Button variant="default" onClick={onOpenAddService} className="gap-2 shrink-0 h-9">
            <Plus className="w-3.5 h-3.5" />
            <span>New Service Record</span>
          </Button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Total Service Spend</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-1">
            {formatAmount(metrics.totalServiceSpent)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {metrics.serviceCount} service entries
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Parts Replaced</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-1">
            {metrics.partsReplacedCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Components logged</p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Last Serviced At</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-1">
            {metrics.lastServiceOdometer ? formatDistance(metrics.lastServiceOdometer, settings.distanceUnit) : '--'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {metrics.lastServiceDate ? formatDateTime(metrics.lastServiceDate).split(',')[0] : 'No records'}
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium">Cost / {settings.distanceUnit}</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-1">
            {metrics.serviceCostPerKm > 0 ? `${metrics.serviceCostPerKm.toFixed(2)} / ${settings.distanceUnit}` : '--'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Maintenance rate</p>
        </div>
      </div>

      {/* Wear & Tear Component Life Tracker */}
      <ComponentWearCard />

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by service type, parts replaced, workshop or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="text-xs sm:text-sm h-9"
          />
        </div>
      </div>

      {/* Service List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No service records found</p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? 'Try clearing your search query' : 'Keep your bike healthy by logging regular maintenance and part changes!'}
                </p>
              </div>
              {!searchQuery && (
                <Button size="sm" variant="outline" onClick={onOpenAddService}>
                  Log Service
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record: ServiceRecord) => {
            const isExpanded = expandedRecordId === record.id;
            const hasParts = record.parts && record.parts.length > 0;

            return (
              <Card
                key={record.id}
                className="border-border hover:border-border/80 transition-colors overflow-hidden group"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Main info */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base sm:text-lg text-foreground font-mono">
                          {formatAmount(record.totalCost)}
                        </span>

                        <span className="flex items-center gap-1 font-mono text-xs bg-muted/60 px-1.5 py-0.5 rounded text-foreground font-medium">
                          <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                          {formatDistance(record.odometer, settings.distanceUnit)}
                        </span>

                        {record.mechanicOrCenter && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5" />
                            <span className="font-medium text-foreground">{record.mechanicOrCenter}</span>
                          </span>
                        )}
                      </div>

                      {/* Service Category Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {record.serviceTypes.map((t: string) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-[11px] font-medium capitalize"
                          >
                            {t.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>

                      {record.notes && (
                        <p className="text-xs text-muted-foreground italic pt-0.5">
                          "{record.notes}"
                        </p>
                      )}
                    </div>

                    {/* Right side: Date, Parts toggle & Delete */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateTime(record.dateTime)}
                        </p>
                      </div>

                      {hasParts && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(record.id)}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>{record.parts.length} parts</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted"
                        title="Delete service record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable itemized parts table */}
                  {isExpanded && hasParts && (
                    <div className="mt-3 pt-3 border-t border-border/60 bg-muted/20 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                        Itemized Parts Replaced
                      </p>
                      <div className="divide-y divide-border border border-border rounded-md bg-card overflow-hidden">
                        {record.parts.map((p: ServicePartItem, idx: number) => (
                          <div key={p.id || idx} className="flex items-center justify-between p-2 text-xs">
                            <span className="font-medium text-foreground">{p.name}</span>
                            <span className="font-medium text-muted-foreground font-mono">
                              {formatAmount(p.cost)}
                            </span>
                          </div>
                        ))}
                        {record.laborCost ? (
                          <div className="flex items-center justify-between p-2 text-xs bg-muted/40">
                            <span className="font-medium text-muted-foreground">Labor Charges</span>
                            <span className="font-medium text-muted-foreground font-mono">
                              {formatAmount(record.laborCost)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
