import React, { useRef, useState, useEffect } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  Database,
  Trash2,
  CheckCircle2,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function SettingsPage() {
  const { settings, updateSettings, loadSampleData, removeSampleData, hasDemoData, exportData, importData, clearDatabase } = useVehicle();
  const { theme, setTheme } = useTheme();
  const { success, error, info } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        success('App installed to your home screen!');
        setDeferredPrompt(null);
      }
    } else {
      info('To install this PWA, open your browser menu and select "Add to Home Screen".');
    }
  };

  const handleLoadDemoData = async () => {
    if (window.confirm('Load sample vehicles and records? (This will populate demo bikes, petrol fill-ups & service history)')) {
      await loadSampleData();
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      success('Sample demo fleet loaded successfully!');
    }
  };

  const handleRemoveDemoData = async () => {
    if (
      window.confirm(
        'Remove demo vehicles and all associated demo logs? (Your custom vehicles and records will not be affected.)'
      )
    ) {
      const res = await removeSampleData();
      if (res.count > 0) {
        success('Sample demo fleet removed successfully!');
      } else {
        info('No demo vehicles were found in your garage.');
      }
    }
  };

  const handleExport = async () => {
    try {
      const jsonString = await exportData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_ride_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Backup exported successfully!');
    } catch (err: any) {
      error('Failed to export backup', err.message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      if (content) {
        const result = await importData(content);
        if (result.success) {
          success(result.message);
        } else {
          error(result.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearDatabase = async () => {
    if (
      window.confirm(
        '⚠️ Are you sure you want to erase all vehicles, fuel logs, services and expenses? This cannot be undone.'
      )
    ) {
      await clearDatabase();
      success('All data has been reset.');
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>Settings</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Theme, measurement units, backup/restore, and PWA installation
        </p>
      </div>

      {/* 1. Appearance / Theme */}
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-sm font-semibold">Theme</CardTitle>
          <CardDescription className="text-xs">Select your preferred color mode</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'System', icon: Laptop },
            ].map(t => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors select-none ${isSelected
                    ? 'border-foreground bg-muted text-foreground font-semibold'
                    : 'border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Icon className="w-4 h-4 mb-1.5" />
                  <span className="text-xs">{t.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Units of Measurement */}
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-sm font-semibold">Measurement Units</CardTitle>
          <CardDescription className="text-xs">Configure distance and fuel volume measurements</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Distance */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Distance Unit</label>
              <Select
                value={settings.distanceUnit}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSettings({ distanceUnit: e.target.value as any })}
                className="h-9 text-xs sm:text-sm"
              >
                <option value="km">Kilometers (km)</option>
                <option value="mi">Miles (mi)</option>
              </Select>
            </div>

            {/* Fuel Volume */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Fuel Volume Unit</label>
              <Select
                value={settings.fuelVolumeUnit}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSettings({ fuelVolumeUnit: e.target.value as any })}
                className="h-9 text-xs sm:text-sm"
              >
                <option value="L">Liters (L)</option>
                <option value="gal">Gallons (gal)</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. PWA Installation & Offline */}
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span>PWA Installation & Offline Mode</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Install to home screen for instant offline access
              </CardDescription>
            </div>
            {isInstalled && (
              <span className="flex items-center gap-1 text-xs text-foreground font-medium bg-muted px-2 py-0.5 rounded-md border border-border">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Installed
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">100% Client-Side & Offline</p>
              <p>IndexedDB stores all records locally on your device.</p>
            </div>
            <Button
              variant={isInstalled ? 'secondary' : 'default'}
              size="sm"
              onClick={handleInstallPWA}
              className="shrink-0 text-xs gap-1.5 h-8"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isInstalled ? 'Installed' : 'Install PWA'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Demo Data & Backup / Restore */}
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span>Data Backup & Restore</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Export JSON backup, restore existing files, or populate demo fleet
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Export JSON */}
            <Button
              variant="outline"
              onClick={handleExport}
              className="justify-start gap-2 h-10 text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup (.JSON)</span>
            </Button>

            {/* Import JSON */}
            <Button
              variant="outline"
              onClick={handleImportClick}
              className="justify-start gap-2 h-10 text-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup (.JSON)</span>
            </Button>
          </div>

          <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadDemoData}
                className="text-xs gap-1.5 h-8"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Fleet</span>
              </Button>

              {hasDemoData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveDemoData}
                  className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5 h-8"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Demo Fleet</span>
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDatabase}
              className="text-xs text-destructive hover:bg-destructive/10 gap-1.5 h-8"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Local Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
