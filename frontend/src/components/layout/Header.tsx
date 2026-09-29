import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Search, User, Settings, LogOut } from 'lucide-react';
import { useApp } from '../../app/AppContext';

export function Header() {
  const { profile } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = profile.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleSignOut = () => {
    setMenuOpen(false);
    alert('This is a local demo. Authentication is not configured on the backend.');
  };

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">
          <Brain size={20} />
        </div>
        <div>
          <span className="header-title">AuditTrail AI</span>
          <span className="header-subtitle">Compliance &amp; Audit Memory</span>
        </div>
      </div>
      <div className="header-right">
        <div className="header-search">
          <Search size={14} />
          <span>Search findings…</span>
        </div>
        
        <div className="header-user-menu" ref={menuRef}>
          <button 
            type="button" 
            className="header-avatar"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            {initials}
          </button>
          
          {menuOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <p className="dropdown-name">{profile.displayName}</p>
                <p className="dropdown-email">{profile.email}</p>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                <User size={14} />
                <span>Profile</span>
              </button>
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/settings'); }}>
                <Settings size={14} />
                <span>Settings</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item text-danger" onClick={handleSignOut}>
                <LogOut size={14} />
                <span>Demo Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
