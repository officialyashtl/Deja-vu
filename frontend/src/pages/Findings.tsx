import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { analysisService } from '../services/analysisService';
import type { Finding } from '../types/finding';
import { Plus, Search, X, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badges';
import { useApp } from '../app/AppContext';

export function Findings() {
  const navigate = useNavigate();
  const { setCurrentFinding, resetAnalysis } = useApp();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const loadFindings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analysisService.getFindings();
      setFindings([res.demo_finding, ...(res.historical || [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load findings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, []);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(findings.map((f) => f.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [findings]);

  // Apply search and filters
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Status filter
      if (statusFilter !== 'All' && f.status !== statusFilter) {
        return false;
      }
      
      // Category filter
      if (categoryFilter !== 'All' && f.category !== categoryFilter) {
        return false;
      }
      
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const searchableFields = [
          f.id,
          f.title,
          f.category,
          f.status,
          // @ts-ignore: if resolution exists in historical findings
          f.resolution
        ].filter(Boolean).map(s => String(s).toLowerCase());
        
        if (!searchableFields.some((field) => field.includes(q))) {
          return false;
        }
      }
      
      return true;
    });
  }, [findings, statusFilter, categoryFilter, searchQuery]);

  const handleAnalyze = (finding: Finding) => {
    resetAnalysis();
    setCurrentFinding(finding);
    navigate('/findings/new', { state: { prefill: finding } });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
  };

  const isFiltered = searchQuery.trim() !== '' || statusFilter !== 'All' || categoryFilter !== 'All';

  return (
    <AppShell>
      <div className="page fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Findings</h1>
            <p className="page-subtitle">Review, analyze, and resolve audit findings.</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/findings/new')}
            aria-label="New Finding"
          >
            <Plus size={16} />
            New Finding
          </button>
        </div>

        <div className="findings-controls">
          <div className="search-box">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search findings…"
              aria-label="Search findings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filters-group">
            <select
              aria-label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              aria-label="Filter by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {isFiltered && (
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={clearFilters}
                aria-label="Clear all filters"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="ledger-state-box" style={{ marginTop: '24px' }}>
            <Loader2 size={24} className="spin text-muted" aria-hidden="true" />
            <p>Loading findings...</p>
          </div>
        ) : error ? (
          <div className="ledger-state-box error" style={{ marginTop: '24px' }}>
            <AlertTriangle size={24} aria-hidden="true" />
            <p>{error}</p>
            <button className="btn-secondary" onClick={loadFindings} style={{ marginTop: '12px' }}>
              Retry
            </button>
          </div>
        ) : findings.length === 0 ? (
          <div className="ledger-state-box" style={{ marginTop: '24px' }}>
            <p>No findings available.</p>
            <button className="btn-secondary" onClick={() => navigate('/findings/new')} style={{ marginTop: '12px' }}>
              Create your first finding
            </button>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="ledger-state-box" style={{ marginTop: '24px' }}>
            <p>
              {searchQuery 
                ? 'No findings match your search.' 
                : 'No findings match the selected filters.'}
            </p>
            <button className="btn-secondary" onClick={clearFilters} style={{ marginTop: '12px' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="finding-table desktop-only">
              <thead>
                <tr>
                  <th>Finding ID</th>
                  <th>Finding</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Resolution</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((f) => (
                  <tr
                    key={f.id}
                    className="finding-row clickable-row"
                    onClick={() => handleAnalyze(f)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Analyze finding ${f.id}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAnalyze(f);
                      }
                    }}
                  >
                    <td>
                      <span className="finding-id">{f.id}</span>
                    </td>
                    <td className="finding-title-cell">{f.title}</td>
                    <td>
                      <span className="finding-category">{f.category}</span>
                    </td>
                    <td>
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="finding-resolution-cell">
                      {/* @ts-ignore: resolution may exist on historical findings */}
                      <span className="resolution-text">{f.resolution || '-'}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost-sm"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Mobile Cards View */}
            <div className="mobile-findings-list mobile-only">
              {filteredFindings.map((f) => (
                <div 
                  key={f.id} 
                  className="mobile-finding-card clickable-row"
                  onClick={() => handleAnalyze(f)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Analyze finding ${f.id}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAnalyze(f);
                    }
                  }}
                >
                  <div className="mobile-finding-header">
                    <span className="finding-id">{f.id}</span>
                    <StatusBadge status={f.status} />
                  </div>
                  <h3 className="mobile-finding-title">{f.title}</h3>
                  <div className="mobile-finding-meta">
                    <span className="finding-category">{f.category}</span>
                  </div>
                  {/* @ts-ignore */}
                  {f.resolution && (
                    <div className="mobile-finding-resolution">
                      {/* @ts-ignore */}
                      {f.resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
