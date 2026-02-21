import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ImportWizard } from './components/ImportWizard';
import { TemplateLibrary } from './components/TemplateLibrary';
import { Nutrition } from './components/Nutrition';
import { ComplianceCenter } from './components/ComplianceCenter';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';

type AuthRole = 'staff' | 'manager';

type AuthSession = {
  id: string;
  role: AuthRole;
};

const LOGIN_ACCOUNTS: Record<string, { password: string; role: AuthRole }> = {
  sub: { password: '1234', role: 'staff' },
  mana: { password: '0000', role: 'manager' }
};

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

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
  const handleNavigateToTemplateHistory = (residentId?: string) => {
    if (residentId) {
      setSelectedResidentId(residentId);
    }
    setTemplateEditorOpen(false);
    setActiveSection('templates');
  };

  const handleSectionChange = (section: string) => {
    if (!authSession) {
      return;
    }
    if (authSession.role === 'staff' && section === 'compliance') {
      return;
    }
    setActiveSection(section);
    if (section !== 'templates') {
      setTemplateEditorOpen(false);
    }
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedId = loginId.trim().toLowerCase();
    const account = LOGIN_ACCOUNTS[normalizedId];

    if (!account || account.password !== loginPassword) {
      setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    setAuthSession({ id: normalizedId, role: account.role });
    setLoginError('');
    setLoginPassword('');
    setActiveSection(account.role === 'manager' ? 'compliance' : 'dashboard');
  };

  const handleLogout = () => {
    setAuthSession(null);
    setActiveSection('dashboard');
    setSelectedResidentId(null);
    setTemplateEditorOpen(false);
    setLoginId('');
    setLoginPassword('');
    setLoginError('');
  };

  const renderContent = () => {
    if (!authSession) {
      return null;
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigateToResident={handleNavigateToResident} onLogout={handleLogout} />;
      case 'import':
        return (
          <ImportWizard
            selectedResidentId={selectedResidentId}
            onNavigateToTemplateEditor={handleNavigateToTemplateEditor}
            onNavigateToTemplateHistory={handleNavigateToTemplateHistory}
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
        if (authSession.role !== 'manager') {
          return <Dashboard onNavigateToResident={handleNavigateToResident} onLogout={handleLogout} />;
        }
        return <ComplianceCenter />;
      default:
        return <Dashboard onNavigateToResident={handleNavigateToResident} onLogout={handleLogout} />;
    }
  };

  if (!authSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <p className="text-sm text-muted-foreground">요양원 시스템 계정으로 로그인하세요.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">요양원 직원</span>{' '}
                <span className="font-mono text-foreground">sub</span> / <span className="font-mono text-foreground">1234</span>
              </p>
              <p>
                <span className="font-semibold text-foreground">요양원장</span>{' '}
                <span className="font-mono text-foreground">mana</span> / <span className="font-mono text-foreground">0000</span>
              </p>
            </div>
            <form className="space-y-3" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="login-id">아이디</Label>
                <Input
                  id="login-id"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="아이디 입력"
                  autoComplete="username"
                  className="border-slate-300 bg-white focus-visible:border-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">비밀번호</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="비밀번호 입력"
                  autoComplete="current-password"
                  className="border-slate-300 bg-white focus-visible:border-slate-500"
                />
              </div>
              {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
              <Button type="submit" className="w-full">로그인</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        canAccessCompliance={authSession.role === 'manager'}
      />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
