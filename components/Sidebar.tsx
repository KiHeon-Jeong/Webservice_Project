import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  BarChart3, 
  Shield, 
  Building2
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'import', label: 'Immune', icon: Upload },
  { id: 'nutrition', label: 'Nutrition', icon: BarChart3 },
  { id: 'templates', label: 'Template', icon: FileText },
  { id: 'compliance', label: 'Management', icon: Shield },
];

export function Sidebar({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  void isCollapsed;
  void onToggleCollapse;
  return (
    <div
      className="bg-sidebar border-r border-sidebar-border flex w-20 flex-col"
    >
      {/* Header */}
      <div className="border-b border-sidebar-border p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  title={item.label}
                  className={`w-full flex flex-col items-center gap-2 rounded-lg px-3 py-2 text-center text-[11px] font-medium leading-tight transition-colors ${
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <span className="text-sm">O2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
