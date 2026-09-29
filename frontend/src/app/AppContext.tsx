import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppState, Finding, AnalysisResult } from '../types/finding';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Density = 'comfortable' | 'compact';
export type DefaultLanding = 'dashboard' | 'findings';

export interface UserProfile {
  displayName: string;
  role: string;
  organization: string;
  email: string;
}

interface AppPreferences {
  sidebarCollapsed: boolean;
  density: Density;
  defaultLanding: DefaultLanding;
}

interface AppContextValue extends AppState {
  setCurrentFinding: (finding: Finding) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setIsAnalyzing: (v: boolean) => void;
  setAnalysisStep: (step: string) => void;
  setResolutionState: (state: 'idle' | 'resolving' | 'resolved' | 'open') => void;
  setAnalysisError: (error: string | null) => void;
  resetAnalysis: () => void;
  
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  
  preferences: AppPreferences;
  updatePreferences: (partial: Partial<AppPreferences>) => void;
  
  profile: UserProfile;
  updateProfile: (partial: Partial<UserProfile>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Yash',
  role: 'Auditor',
  organization: 'AuditTrail AI',
  email: 'yash@audittrail.ai',
};

const DEFAULT_PREFERENCES: AppPreferences = {
  sidebarCollapsed: false,
  density: 'comfortable',
  defaultLanding: 'dashboard',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentFinding, setCurrentFinding] = useState<Finding | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [resolutionState, setResolutionState] = useState<'idle' | 'resolving' | 'resolved' | 'open'>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Initialize Theme
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem('audittrail-theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    return 'system';
  });

  // Initialize Preferences
  const [preferences, setPreferencesState] = useState<AppPreferences>(() => {
    try {
      const stored = localStorage.getItem('audittrail-preferences');
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_PREFERENCES;
  });

  // Initialize Profile
  const [profile, setProfileState] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('audittrail-profile');
      if (stored) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_PROFILE;
  });

  // Theme side-effect
  useEffect(() => {
    try {
      localStorage.setItem('audittrail-theme', theme);
    } catch {}
    
    let activeTheme = theme;
    if (theme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [theme]);
  
  // Listen for system theme changes if mode is 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Preferences side-effect
  useEffect(() => {
    try {
      localStorage.setItem('audittrail-preferences', JSON.stringify(preferences));
    } catch {}
    
    // Apply density attribute to document
    document.documentElement.setAttribute('data-density', preferences.density);
  }, [preferences]);

  // Profile side-effect
  useEffect(() => {
    try {
      localStorage.setItem('audittrail-profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  
  const updatePreferences = (partial: Partial<AppPreferences>) => {
    setPreferencesState(prev => ({ ...prev, ...partial }));
  };
  
  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfileState(prev => ({ ...prev, ...partial }));
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setAnalysisStep('');
    setResolutionState('idle');
    setAnalysisError(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentFinding,
        analysisResult,
        isAnalyzing,
        analysisStep,
        resolutionState,
        analysisError,
        setCurrentFinding,
        setAnalysisResult,
        setIsAnalyzing,
        setAnalysisStep,
        setResolutionState,
        setAnalysisError,
        resetAnalysis,
        theme,
        setTheme,
        preferences,
        updatePreferences,
        profile,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
