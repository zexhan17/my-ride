import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { VehicleProvider, useVehicle } from './context/VehicleContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { QuickActionFAB } from './components/common/QuickActionFAB';
import { DashboardPage } from './pages/DashboardPage';
import { FuelPage } from './pages/FuelPage';
import { ServicePage } from './pages/ServicePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AddFuelPage } from './pages/AddFuelPage';
import { AddServicePage } from './pages/AddServicePage';
import { AddExpensePage } from './pages/AddExpensePage';
import { AddReminderPage } from './pages/AddReminderPage';
import { VehicleFormPage } from './pages/VehicleFormPage';
import { GarageManagerPage } from './pages/GarageManagerPage';
import { ServiceDossierPage } from './pages/ServiceDossierPage';
import { DocumentVaultPage } from './pages/DocumentVaultPage';
import type { Vehicle } from './types';
import { checkAndNotifyDueReminders } from './lib/notifications';

function AppContent() {
  const { activeVehicle, vehicles, reminders, settings, isLoading } = useVehicle();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [previousPage, setPreviousPage] = useState<string>('dashboard');
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  // Background check for due reminders & native notification alerts
  useEffect(() => {
    if (!isLoading && settings.notificationsEnabled && settings.reminderNotifications !== false) {
      checkAndNotifyDueReminders(vehicles, reminders, settings);
    }
  }, [isLoading, vehicles, reminders, settings]);

  const navigateTo = (page: string) => {
    setPreviousPage(currentPage);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (currentPage === 'add-vehicle' || currentPage === 'edit-vehicle') {
      if (previousPage === 'garage') {
        setCurrentPage('garage');
        return;
      }
    }
    if (currentPage === 'add-fuel' && previousPage === 'fuel') {
      setCurrentPage('fuel');
      return;
    }
    if ((currentPage === 'add-service' || currentPage === 'dossier') && previousPage === 'service') {
      setCurrentPage('service');
      return;
    }
    if (currentPage === 'add-expense' && previousPage === 'expenses') {
      setCurrentPage('expenses');
      return;
    }
    setCurrentPage(previousPage || 'dashboard');
  };

  const handleOpenAddVehicle = () => {
    setVehicleToEdit(null);
    navigateTo('add-vehicle');
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setVehicleToEdit(veh);
    navigateTo('edit-vehicle');
  };

  const isSubPage = [
    'add-fuel',
    'add-service',
    'add-expense',
    'add-reminder',
    'add-vehicle',
    'edit-vehicle',
    'garage',
    'dossier',
    'vault',
  ].includes(currentPage);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading My Ride...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <Header
        currentPage={currentPage}
        onNavigate={navigateTo}
        onOpenAddVehicle={handleOpenAddVehicle}
        onOpenManageVehicles={() => navigateTo('garage')}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Main Tabs */}
        {currentPage === 'dashboard' && (
          <DashboardPage
            onOpenAddFuel={() => navigateTo('add-fuel')}
            onOpenAddService={() => navigateTo('add-service')}
            onOpenAddExpense={() => navigateTo('add-expense')}
            onOpenAddReminder={() => navigateTo('add-reminder')}
            onOpenAddVehicle={handleOpenAddVehicle}
            onOpenDossier={() => navigateTo('dossier')}
            onOpenVault={() => navigateTo('vault')}
            onEditVehicle={handleOpenEditVehicle}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'fuel' && (
          <FuelPage onOpenAddFuel={() => navigateTo('add-fuel')} />
        )}

        {currentPage === 'service' && (
          <ServicePage
            onOpenAddService={() => navigateTo('add-service')}
            onOpenDossier={() => navigateTo('dossier')}
          />
        )}

        {currentPage === 'expenses' && (
          <ExpensesPage onOpenAddExpense={() => navigateTo('add-expense')} />
        )}

        {currentPage === 'analytics' && <AnalyticsPage />}

        {currentPage === 'settings' && <SettingsPage />}

        {/* Dedicated Sub-Pages */}
        {currentPage === 'add-fuel' && (
          <AddFuelPage onBack={goBack} />
        )}

        {currentPage === 'add-service' && (
          <AddServicePage onBack={goBack} />
        )}

        {currentPage === 'add-expense' && (
          <AddExpensePage onBack={goBack} />
        )}

        {currentPage === 'add-reminder' && (
          <AddReminderPage onBack={goBack} />
        )}

        {(currentPage === 'add-vehicle' || currentPage === 'edit-vehicle') && (
          <VehicleFormPage vehicleToEdit={vehicleToEdit} onBack={goBack} />
        )}

        {currentPage === 'garage' && (
          <GarageManagerPage
            onBack={goBack}
            onAddNew={handleOpenAddVehicle}
            onEditVehicle={handleOpenEditVehicle}
          />
        )}

        {currentPage === 'dossier' && (
          <ServiceDossierPage onBack={goBack} />
        )}

        {currentPage === 'vault' && (
          <DocumentVaultPage onBack={goBack} />
        )}
      </main>

      {/* Quick Action Floating Action Button (Only on main dashboard/tabs) */}
      {activeVehicle && !isSubPage && (
        <QuickActionFAB
          onAddFuel={() => navigateTo('add-fuel')}
          onAddService={() => navigateTo('add-service')}
          onAddExpense={() => navigateTo('add-expense')}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <VehicleProvider>
          <AppContent />
        </VehicleProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
