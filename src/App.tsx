import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/Toast';
import { OverviewPage } from './components/modules/overview/OverviewPage';
import { VaultPage } from './components/modules/vault/VaultPage';
import { IntellectPage } from './components/modules/intellect/IntellectPage';
import { SentinelPage } from './components/modules/sentinel/SentinelPage';
import { SettingsPage } from './components/modules/settings/SettingsPage';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'vault':
        return <VaultPage />;
      case 'intellect':
        return <IntellectPage />;
      case 'sentinel':
        return <SentinelPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent Left Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* Floating Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
