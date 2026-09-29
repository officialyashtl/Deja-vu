import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { MetricCard } from '../components/dashboard/MetricCard';
import { FindingTable } from '../components/dashboard/FindingTable';
import { CategoryBarChart } from '../components/dashboard/CategoryBarChart';
import { Plus, AlertTriangle, CheckCircle2, Activity, Loader2 } from 'lucide-react';
import { analysisService } from '../services/analysisService';
import type { Finding } from '../types/finding';

export function Dashboard() {
  const navigate = useNavigate();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadFindings() {
      try {
        const res = await analysisService.getFindings();
        if (mounted) {
          // The backend returns { demo_finding, historical }
          setFindings([res.demo_finding, ...(res.historical || [])]);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load findings.');
          setLoading(false);
        }
      }
    }
    loadFindings();
    return () => { mounted = false; };
  }, []);

  const metrics = useMemo(() => {
    return {
      activeFindings: findings.filter(f => f.status === 'Open').length,
      resolvedFindings: findings.filter(f => f.status === 'Resolved').length,
    };
  }, [findings]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [findings]);

  return (
    <AppShell>
      <div className="page fade-in">
        {/* Page header */}
        <div className="page-header">
          <div>
            <p className="page-eyebrow">Overview</p>
            <h1 className="page-title">Compliance Overview</h1>
            <p className="page-subtitle">
              Track findings and surface institutional memory when similar issues recur.
            </p>
          </div>
          <button
            id="btn-new-finding"
            className="btn-primary"
            onClick={() => navigate('/findings/new')}
          >
            <Plus size={16} />
            New Finding
          </button>
        </div>

        {/* Loading / Error / Empty States */}
        {loading ? (
          <div className="ledger-state-box" style={{ marginTop: '48px' }}>
            <Loader2 size={24} className="spin text-muted" />
            <p>Loading findings...</p>
          </div>
        ) : error ? (
          <div className="ledger-state-box error" style={{ marginTop: '48px' }}>
            <AlertTriangle size={24} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* KPI metrics */}
            <div className="metrics-grid">
              <MetricCard
                label="Active Findings"
                value={metrics.activeFindings}
                icon={<Activity size={16} />}
              />
              <MetricCard
                label="Resolved Findings"
                value={metrics.resolvedFindings}
                accent="success"
                icon={<CheckCircle2 size={16} />}
              />
            </div>

            {/* Charts row — Category Chart */}
            <div className="charts-row" style={{ gridTemplateColumns: '1fr' }}>
              <CategoryBarChart data={categoryData} />
            </div>

            {/* Findings table */}
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">All Findings</h2>
                <span className="section-count">{findings.length} findings</span>
              </div>
              <FindingTable findings={findings} showAnalyzeLink />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
