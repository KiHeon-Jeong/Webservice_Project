import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ImportWizard } from './components/ImportWizard';
import { TemplateLibrary } from './components/TemplateLibrary';
import { SequenceGenerator } from './components/SequenceGenerator';
import { Analytics } from './components/Analytics';
import { PaymentPortal } from './components/PaymentPortal';
import { ComplianceCenter } from './components/ComplianceCenter';
import { Settings } from './components/Settings';

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'import':
        return <ImportWizard />;
      case 'templates':
        return <TemplateLibrary />;
      case 'sequences':
        return <SequenceGenerator />;
      case 'analytics':
        return <Analytics />;
      case 'payments':
        return <PaymentPortal />;
      case 'compliance':
        return <ComplianceCenter />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
