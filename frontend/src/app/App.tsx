import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { ToastProvider } from '../components/ui/ToastContext';
import { Dashboard } from '../pages/Dashboard';
import { CreateFinding } from '../pages/CreateFinding';
import { FindingAnalysis } from '../pages/FindingAnalysis';
import { DecisionLedger } from '../pages/DecisionLedger';
import { MemoryTimeline } from '../pages/MemoryTimeline';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { Findings } from '../pages/Findings';

function RootRedirect() {
  const { preferences } = useApp();
  if (preferences.defaultLanding === 'findings') {
    return <Navigate to="/findings" replace />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/findings/new" element={<CreateFinding />} />
            <Route path="/findings/analysis" element={<FindingAnalysis />} />
            <Route path="/ledger" element={<DecisionLedger />} />
            <Route path="/memory" element={<MemoryTimeline />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}
