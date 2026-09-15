import { useState, useRef, useEffect } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import {
  Sun,
  Moon,
  ChevronDown,
  Plus,
  Settings as SettingsIcon,
  Gauge,
  Bike,
  Car,
  CircleDot,
  Check,
} from 'lucide-react';

interface HeaderProps {
  onOpenAddVehicle: () => void;
  onOpenManageVehicles: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({
  onOpenAddVehicle,
  onOpenManageVehicles,
  onNavigate,
  currentPage,
}: HeaderProps) {
  const { vehicles, activeVehicle, setActiveVehicleId } = useVehicle();
  const { isDark, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getVehicleIcon = (type?: string) => {
    switch (type) {
      case 'car':
        return <Car className="w-4 h-4" />;
      case 'bike':
      case 'scooter':
        return <Bike className="w-4 h-4" />;
      default:
        return <CircleDot className="w-4 h-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Brand & Vehicle Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center font-bold">
              <Gauge className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight hidden xs:inline-block">
              MyRide
            </span>
          </div>

          <div className="h-4 w-px bg-border mx-0.5 hidden sm:block shrink-0" />

          {/* Vehicle Dropdown Switcher */}
          <div className="relative shrink min-w-0" ref={dropdownRef}>
            {activeVehicle ? (
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-medium transition-colors max-w-[200px] sm:max-w-[280px]"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-border"
                  style={{ backgroundColor: activeVehicle.colorHex || '#38bdf8' }}
                />
                <span className="truncate font-medium text-left">
                  {activeVehicle.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-auto" />
              </button>
            ) : (
              <Button size="sm" variant="outline" onClick={onOpenAddVehicle} className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vehicle</span>
              </Button>
            )}

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 sm:w-72 rounded-lg border border-border bg-popover p-1 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                  Garage ({vehicles.length})
                </div>

                <div className="max-h-60 overflow-y-auto space-y-0.5 py-0.5">
                  {vehicles.map(v => {
                    const isSelected = v.id === activeVehicle?.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setActiveVehicleId(v.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-md text-left text-xs transition-colors ${isSelected
                            ? 'bg-muted text-foreground font-medium'
                            : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: v.colorHex || '#38bdf8' }}
                          />
                          {getVehicleIcon(v.type)}
                          <div className="min-w-0">
                            <p className="truncate text-xs">{v.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {v.registrationNumber || `${v.currentOdometer.toLocaleString()} km`}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-border mt-1 pt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenAddVehicle();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Vehicle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenManageVehicles();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {getVehicleIcon(activeVehicle?.type)}
                    <span>Manage All Vehicles</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { id: 'dashboard', label: 'Overview' },
            { id: 'fuel', label: 'Fuel Logs' },
            { id: 'service', label: 'Service' },
            { id: 'expenses', label: 'Expenses' },
            { id: 'analytics', label: 'Analytics' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${currentPage === tab.id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Action Icons: Theme Toggle & Settings */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button
            variant={currentPage === 'settings' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onNavigate('settings')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Settings & Data Management"
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
