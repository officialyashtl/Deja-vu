import { AppShell } from '../components/layout/AppShell';
import { useApp } from '../app/AppContext';
import type { ThemeMode, Density, DefaultLanding } from '../app/AppContext';
import { Settings as SettingsIcon, Monitor, Layout, Info } from 'lucide-react';
import pkg from '../../package.json'; // We can try to import version if configured, or just provide it.

export function Settings() {
  const { theme, setTheme, preferences, updatePreferences } = useApp();

  return (
    <AppShell>
      <div className="page fade-in">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">Preferences</p>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage application appearance and behavior.</p>
          </div>
        </div>

        <div className="settings-layout">
          {/* SECTION A — Appearance */}
          <section className="settings-section">
            <h2 className="settings-heading">
              <Monitor size={18} /> Appearance
            </h2>
            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-info">
                  <label>Theme</label>
                  <span>Select the application color theme.</span>
                </div>
                <div className="settings-control">
                  <select 
                    value={theme} 
                    onChange={(e) => setTheme(e.target.value as ThemeMode)}
                    className="form-select w-auto"
                  >
                    <option value="system">System Default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION B — Interface */}
          <section className="settings-section">
            <h2 className="settings-heading">
              <Layout size={18} /> Interface
            </h2>
            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-info">
                  <label>Sidebar</label>
                  <span>Keep sidebar expanded or collapsed.</span>
                </div>
                <div className="settings-control">
                  <select 
                    value={preferences.sidebarCollapsed ? 'collapsed' : 'expanded'} 
                    onChange={(e) => updatePreferences({ sidebarCollapsed: e.target.value === 'collapsed' })}
                    className="form-select w-auto"
                  >
                    <option value="expanded">Expanded</option>
                    <option value="collapsed">Collapsed</option>
                  </select>
                </div>
              </div>
              <div className="settings-divider" />
              <div className="settings-row">
                <div className="settings-info">
                  <label>Density</label>
                  <span>Adjust the spacing of elements.</span>
                </div>
                <div className="settings-control">
                  <select 
                    value={preferences.density} 
                    onChange={(e) => updatePreferences({ density: e.target.value as Density })}
                    className="form-select w-auto"
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION C — Preferences */}
          <section className="settings-section">
            <h2 className="settings-heading">
              <SettingsIcon size={18} /> Preferences
            </h2>
            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-info">
                  <label>Default Landing Page</label>
                  <span>The page shown when you first sign in.</span>
                </div>
                <div className="settings-control">
                  <select 
                    value={preferences.defaultLanding} 
                    onChange={(e) => updatePreferences({ defaultLanding: e.target.value as DefaultLanding })}
                    className="form-select w-auto"
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="findings">Findings</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION D — About */}
          <section className="settings-section">
            <h2 className="settings-heading">
              <Info size={18} /> About
            </h2>
            <div className="settings-card about-card">
              <h3>AuditTrail AI</h3>
              <p>Hindsight-powered compliance intelligence</p>
              <div className="version-badge">Version {pkg?.version || '1.0.0'}</div>
            </div>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
