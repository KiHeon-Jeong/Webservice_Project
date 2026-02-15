import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ImportWizard } from './components/ImportWizard';
import { TemplateLibrary } from './components/TemplateLibrary';
import { Nutrition } from './components/Nutrition';
import { ComplianceCenter } from './components/ComplianceCenter';

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);

  const handleNavigateToResident = (residentId: string) => {
    setSelectedResidentId(residentId);
    setActiveSection('import');
  };

  const handleNavigateToTemplateEditor = (residentId?: string) => {
    if (residentId) {
      setSelectedResidentId(residentId);
    }
    setTemplateEditorOpen(true);
    setActiveSection('templates');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (section !== 'templates') {
      setTemplateEditorOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigateToResident={handleNavigateToResident} />;
      case 'import':
        return (
          <ImportWizard
            selectedResidentId={selectedResidentId}
            onNavigateToTemplateEditor={handleNavigateToTemplateEditor}
          />
        );
      case 'templates':
        return (
          <TemplateLibrary
            startInEditor={templateEditorOpen}
            onEditorClose={() => setTemplateEditorOpen(false)}
            selectedResidentId={selectedResidentId}
          />
        );
      case 'nutrition':
        return <Nutrition />;
      case 'compliance':
        return <ComplianceCenter />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
