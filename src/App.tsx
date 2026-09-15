import React, { useState } from 'react';
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
import { FuelLogModal } from './components/modals/FuelLogModal';
import { ServiceLogModal } from './components/modals/ServiceLogModal';
import { ExpenseLogModal } from './components/modals/ExpenseLogModal';
import { ReminderModal } from './components/modals/ReminderModal';
import { VehicleModal } from './components/modals/VehicleModal';
import { VehicleManagerModal } from './components/modals/VehicleManagerModal';
import type { Vehicle } from './types';

function AppContent() {
  const { activeVehicle, isLoading } = useVehicle();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  // Modal States
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isManageVehiclesOpen, setIsManageVehiclesOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setVehicleToEdit(veh);
    setIsAddVehicleOpen(true);
  };

  const handleCloseVehicleModal = () => {
    setIsAddVehicleOpen(false);
    setVehicleToEdit(null);
  };

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
        onNavigate={setCurrentPage}
        onOpenAddVehicle={() => {
          setVehicleToEdit(null);
          setIsAddVehicleOpen(true);
        }}
        onOpenManageVehicles={() => setIsManageVehiclesOpen(true)}
      />

      {/* Main Container View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        {currentPage === 'dashboard' && (
          <DashboardPage
            onOpenAddFuel={() => setIsAddFuelOpen(true)}
            onOpenAddService={() => setIsAddServiceOpen(true)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenAddReminder={() => setIsAddReminderOpen(true)}
            onOpenAddVehicle={() => {
              setVehicleToEdit(null);
              setIsAddVehicleOpen(true);
            }}
            onEditVehicle={handleOpenEditVehicle}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'fuel' && (
          <FuelPage onOpenAddFuel={() => setIsAddFuelOpen(true)} />
        )}

        {currentPage === 'service' && (
          <ServicePage onOpenAddService={() => setIsAddServiceOpen(true)} />
        )}

        {currentPage === 'expenses' && (
          <ExpensesPage onOpenAddExpense={() => setIsAddExpenseOpen(true)} />
        )}

        {currentPage === 'analytics' && <AnalyticsPage />}

        {currentPage === 'settings' && <SettingsPage />}
      </main>

      {/* Floating Action Button (Quick entry shortcuts) */}
      {activeVehicle && (
        <QuickActionFAB
          onAddFuel={() => setIsAddFuelOpen(true)}
          onAddService={() => setIsAddServiceOpen(true)}
          onAddExpense={() => setIsAddExpenseOpen(true)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Modals */}
      <FuelLogModal
        isOpen={isAddFuelOpen}
        onClose={() => setIsAddFuelOpen(false)}
      />

      <ServiceLogModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
      />

      <ExpenseLogModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />

      <ReminderModal
        isOpen={isAddReminderOpen}
        onClose={() => setIsAddReminderOpen(false)}
      />

      <VehicleModal
        isOpen={isAddVehicleOpen}
        onClose={handleCloseVehicleModal}
        vehicleToEdit={vehicleToEdit}
      />

      <VehicleManagerModal
        isOpen={isManageVehiclesOpen}
        onClose={() => setIsManageVehiclesOpen(false)}
        onAddNew={() => {
          setVehicleToEdit(null);
          setIsAddVehicleOpen(true);
        }}
        onEditVehicle={handleOpenEditVehicle}
      />
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

