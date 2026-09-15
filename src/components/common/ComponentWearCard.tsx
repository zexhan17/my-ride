import React, { useState } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import {
  Activity,
  RotateCcw,
  Plus,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Settings2,
} from 'lucide-react';
import { formatDistance } from '../../lib/utils';
import type { ComponentWearStatus, ComponentType } from '../../types';

export function ComponentWearCard() {
  const { activeVehicle, componentWear, addComponentWear, resetComponentWear, deleteComponentWear, settings } = useVehicle();
  const { success, error } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ComponentType>('engine_oil');
  const [intervalKm, setIntervalKm] = useState('5000');
  const [lastReplacedOdometer, setLastReplacedOdometer] = useState(
    activeVehicle ? String(activeVehicle.currentOdometer || activeVehicle.initialOdometer || 0) : '0'
  );
  const [notes, setNotes] = useState('');

  if (!activeVehicle) return null;

  const handleReset = async (item: ComponentWearStatus) => {
    const currentOdo = activeVehicle.currentOdometer || activeVehicle.initialOdometer || 0;
    if (
      window.confirm(
        `Reset "${item.name}" wear cycle? This sets the replacement odometer to current meter (${currentOdo.toLocaleString()} ${settings.distanceUnit}).`
      )
    ) {
      await resetComponentWear(item.id, currentOdo);
      success(`Reset wear cycle for ${item.name}!`);
    }
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    const interval = parseFloat(intervalKm);
    const lastOdo = parseFloat(lastReplacedOdometer);

    if (isNaN(interval) || interval <= 0) {
      error('Please enter a valid replacement interval distance.');
      return;
    }
    if (!name.trim()) {
      error('Please enter component name.');
      return;
    }

    try {
      await addComponentWear({
        vehicleId: activeVehicle.id,
        name: name.trim(),
        type,
        intervalKm: interval,
        lastReplacedOdometer: isNaN(lastOdo) ? 0 : lastOdo,
        notes: notes.trim() || undefined,
      });

      success(`Added "${name}" wear tracker.`);
      setIsAddModalOpen(false);
      setName('');
      setIntervalKm('5000');
      setNotes('');
    } catch (err: any) {
      error('Failed to add component', err.message);
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (window.confirm(`Remove tracker for "${itemName}"?`)) {
      await deleteComponentWear(id);
      success(`Removed "${itemName}".`);
    }
  };

  return (
    <>
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>Wear & Tear Component Life</span>
                <span className="text-xs font-normal text-muted-foreground">({componentWear.length})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time consumable parts health based on odometer accumulation
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLastReplacedOdometer(String(activeVehicle.currentOdometer || 0));
                setIsAddModalOpen(true);
              }}
              className="gap-1.5 text-xs h-8 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Track Component</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {componentWear.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Wrench className="w-7 h-7 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-semibold text-foreground">No components tracked yet</p>
              <p className="text-[11px] text-muted-foreground">
                Track consumable parts like Engine Oil, Brake Pads, Chain & Tyres to get replacement alerts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {componentWear.map(item => {
                const isOverdue = item.isDue;
                const isWarn = item.isWarning;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${isOverdue
                        ? 'border-destructive/40 bg-destructive/5'
                        : isWarn
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-border bg-card'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-foreground truncate">{item.name}</h4>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Due for Change
                            </Badge>
                          )}
                          {isWarn && (
                            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 py-0 px-1.5">
                              Replace Soon
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Interval: {formatDistance(item.intervalKm, settings.distanceUnit)} • Last at: {formatDistance(item.lastReplacedOdometer, settings.distanceUnit)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleReset(item)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Reset wear cycle (New replacement)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item.id, item.name)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Delete tracker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-medium text-foreground">
                          {item.kmRemaining > 0
                            ? `${formatDistance(item.kmRemaining, settings.distanceUnit)} left`
                            : '0 left'}
                        </span>
                        <span
                          className={`font-mono font-bold ${isOverdue
                              ? 'text-destructive'
                              : isWarn
                                ? 'text-amber-500'
                                : 'text-foreground'
                            }`}
                        >
                          {item.percentageRemaining}% Life
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border/40">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isOverdue
                              ? 'bg-destructive'
                              : isWarn
                                ? 'bg-amber-500'
                                : 'bg-foreground'
                            }`}
                          style={{ width: `${Math.max(0, Math.min(100, item.percentageRemaining))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Wear Tracker Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Track Wear & Tear Component"
        description="Monitor consumable parts life and get proactive maintenance alerts"
        maxWidth="md"
      >
        <form onSubmit={handleSaveComponent} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Component Name *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Motul 7100 Engine Oil / Brake Pads"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Component Type</label>
              <Select
                value={type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as ComponentType)}
                className="h-9 text-xs sm:text-sm"
              >
                <option value="engine_oil">Engine Oil & Filter</option>
                <option value="brake_pads">Brake Pads</option>
                <option value="chain_sprocket">Chain & Sprocket</option>
                <option value="drive_belt">CVT Drive Belt</option>
                <option value="air_filter">Air Filter</option>
                <option value="spark_plug">Spark Plug</option>
                <option value="front_tyre">Front Tyre</option>
                <option value="rear_tyre">Rear Tyre</option>
                <option value="battery">Battery</option>
                <option value="coolant">Radiator Coolant</option>
                <option value="custom">Custom Part</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Replacement Interval ({settings.distanceUnit}) *
              </label>
              <Input
                type="number"
                value={intervalKm}
                onChange={e => setIntervalKm(e.target.value)}
                placeholder="e.g. 5000"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              Last Replaced Odometer ({settings.distanceUnit})
            </label>
            <Input
              type="number"
              value={lastReplacedOdometer}
              onChange={e => setLastReplacedOdometer(e.target.value)}
              placeholder="Odometer reading when this part was installed"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Notes (Optional)</label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Brand, grade, specification"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-semibold"
            >
              Save Tracker
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
