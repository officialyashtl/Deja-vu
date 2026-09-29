import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useApp } from '../app/AppContext';
import { User, Mail, Briefcase, Building, Save, Shield } from 'lucide-react';

export function Profile() {
  const { profile, updateProfile } = useApp();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);

  const initials = form.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell>
      <div className="page fade-in">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">Account</p>
            <h1 className="page-title">Profile</h1>
            <p className="page-subtitle">Manage your local demo profile information.</p>
          </div>
        </div>

        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="profile-avatar-large">
              {initials}
            </div>
            <h3 className="profile-name">{profile.displayName}</h3>
            <p className="profile-role">{profile.role} at {profile.organization}</p>
            <div className="profile-badge">
              <Shield size={14} /> Local Demo
            </div>
          </div>

          <div className="profile-content">
            <form className="form-layout" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="displayName" className="form-label">
                      <User size={14} className="input-icon" /> Display Name
                    </label>
                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      className="form-input"
                      value={form.displayName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <Mail size={14} className="input-icon" /> Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-input bg-muted"
                      value={form.email}
                      disabled
                      title="Email cannot be changed in local demo"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role" className="form-label">
                      <Briefcase size={14} className="input-icon" /> Role
                    </label>
                    <input
                      id="role"
                      name="role"
                      type="text"
                      className="form-input"
                      value={form.role}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="organization" className="form-label">
                      <Building size={14} className="input-icon" /> Organization
                    </label>
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      className="form-input bg-muted"
                      value={form.organization}
                      disabled
                      title="Organization cannot be changed in local demo"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                {saved && <span className="text-success text-sm fade-in">Profile saved locally.</span>}
                <button type="submit" className="btn-primary">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
