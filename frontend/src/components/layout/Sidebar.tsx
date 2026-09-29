import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSearch, ShieldCheck, Library, Clock, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../app/AppContext';

export function Sidebar() {
  const { preferences, updatePreferences } = useApp();
  const collapsed = preferences.sidebarCollapsed;

  const toggleSidebar = () => {
    updatePreferences({ sidebarCollapsed: !collapsed });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Dashboard">
          <LayoutDashboard size={16} />
          <span className="sidebar-label">Dashboard</span>
        </NavLink>
        <NavLink to="/findings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Findings">
          <FileSearch size={16} />
          <span className="sidebar-label">Findings</span>
        </NavLink>
        <NavLink to="/ledger" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Decision Ledger">
          <Library size={16} />
          <span className="sidebar-label">Decision Ledger</span>
        </NavLink>
        <NavLink to="/memory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Memory Timeline">
          <Clock size={16} />
          <span className="sidebar-label">Memory Timeline</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Settings">
          <Settings size={16} />
          <span className="sidebar-label">Settings</span>
        </NavLink>
        
        <div className="sidebar-footer">
          <button type="button" className="sidebar-collapse-btn" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          {!collapsed && (
            <div className="sidebar-product-tag">
              <ShieldCheck size={14} />
              <span>SOC 2 Ready</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
