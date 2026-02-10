import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Workflow, 
  BarChart3, 
  CreditCard, 
  Shield, 
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'import', label: '환자 면역 관리 페이지', icon: Upload },
  { id: 'analytics', label: '건기식 페이지', icon: BarChart3 },
  { id: 'templates', label: 'Template', icon: FileText },
  { id: 'sequences', label: 'Seqiences', icon: Workflow },
  { id: 'payments', label: 'payment', icon: CreditCard },
  { id: 'compliance', label: '원장 관리 센터', icon: Shield },
  { id: 'settings', label: 'setting', icon: Settings },
];

export function Sidebar({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <div
      className={`bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className={`border-b border-sidebar-border ${isCollapsed ? 'p-4' : 'p-6'}`}>
        <div
          className={`flex ${
            isCollapsed ? 'flex-col items-center gap-3' : 'items-center gap-3'
          }`}
        >
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-sidebar-foreground font-medium">2조이기조</h1>
              <p className="text-sm text-muted-foreground">요양원관리시스템</p>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 ${
              isCollapsed ? '' : 'ml-auto'
            }`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
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
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isCollapsed ? 'justify-center' : 'gap-3'
                  } ${
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={isCollapsed ? 'sr-only' : ''}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm">O2</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground truncate">kdtoracle2</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
