import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/ToastContext';
import { AppShell } from '../components/layout/AppShell';
import { SeverityBadge, StatusBadge } from '../components/ui/Badges';
import { useApp } from '../app/AppContext';
import { analysisService } from '../services/analysisService';
import type { HistoricalMatch } from '../types/finding';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Database,
  GitCompare,
  Layers,
  Loader2,
  Sparkles,
  FolderOpen,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

// ── Helper: format a score to 0–100% string ──────────────────────────────────
function pct(score: number | null | undefined): string {
  if (score == null) return '—';
  return `${Math.round(score * 100)}%`;
}

// ── Helper: format ISO date string to readable ───────────────────────────────
function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ── Helper: extract title/id from Hindsight stored text ──────────────────────
function parseMatchText(text: string | null): { id: string | null; title: string | null } {
  if (!text) return { id: null, title: null };
  const idMatch = text.match(/Finding\s+(\S+):/);
  const titleMatch = text.match(/Finding\s+[^:]+:\s*([^.]+)/);
  return {
    id: idMatch?.[1] ?? null,
    title: titleMatch?.[1]?.trim() ?? text.slice(0, 80),
  };
}

// ── Single historical match row ───────────────────────────────────────────────
function MatchRow({ match, index }: { match: HistoricalMatch; index: number }) {
  const { id, title } = parseMatchText(match.text);
  const semantic = match.scores?.semantic;
  const final = match.scores?.final;

  return (
    <div className="hist-match-row">
      <div className="hist-match-rank">#{index + 1}</div>
      <div className="hist-match-body">
        <div className="hist-match-id-row">
          {id && <span className="finding-id">{id}</span>}
          {title && <span className="hist-match-title">{title}</span>}
        </div>
        <div className="hist-match-scores">
          {semantic != null && (
            <span className="score-chip">
              Semantic <strong>{pct(semantic)}</strong>
            </span>
          )}
          {final != null && (
            <span className="score-chip">
              Final <strong>{pct(final)}</strong>
            </span>
          )}
          {match.occurred_at && (
            <span className="score-chip muted">
              {formatDate(match.occurred_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comparison row inside What Changed ───────────────────────────────────────
function CompareRow({
  label,
  current,
  historical,
}: {
  label: string;
  current: string | null;
  historical: string | null;
}) {
  return (
    <div className="compare-row">
      <span className="compare-label">{label}</span>
      <div className="compare-values">
        <span className="compare-current">{current ?? '—'}</span>
        <ArrowRight size={12} className="compare-arrow" />
        <span className="compare-historical">{historical ?? '—'}</span>
      </div>
    </div>
  );
}

// ── Bool chip ─────────────────────────────────────────────────────────────────
function BoolChip({ value, label }: { value: boolean | null; label: string }) {
  if (value === null) return null;
  return (
    <span className={`bool-chip ${value ? 'bool-yes' : 'bool-no'}`}>
      {value ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {label}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function FindingAnalysis() {
  const navigate = useNavigate();
  const {
    currentFinding,
    analysisResult,
    analysisError,
    resolutionState,
    setResolutionState,
    setIsAnalyzing,
    setAnalysisStep,
    setAnalysisResult,
    setAnalysisError,
  } = useApp();

  const { showToast } = useToast();

  const [currentStatus, setCurrentStatus] = useState<'Open' | 'Resolved'>('Open');
  const [resolvingError, setResolvingError] = useState<string | null>(null);

  // Dialog State
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionValidationError, setResolutionValidationError] = useState<string | null>(null);
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);
  
  const [resolutionResult, setResolutionResult] = useState<{
    resolved_by?: string;
    resolved_at?: string;
    resolution?: string;
  } | null>(null);
  
  const handleRetryAnalysis = async () => {
    if (!currentFinding) return;
    setAnalysisError(null);
    setIsAnalyzing(true);
    setAnalysisStep('Initiating analysis...');
    try {
      const result = await analysisService.analyzeFinding(currentFinding);
      setAnalysisResult(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Unable to analyze finding.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Guard: backend error
  if (analysisError) {
    return (
      <AppShell>
        <div className="page fade-in">
          <div className="empty-state">
            <AlertCircle size={40} />
            <p>Unable to analyze finding. {analysisError}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn-primary" onClick={handleRetryAnalysis}>
                Retry Analysis
              </button>
              <button className="btn-secondary" onClick={() => navigate('/findings/new')}>
                Back to Findings
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Guard: no data
  if (!currentFinding || !analysisResult) {
    return (
      <AppShell>
        <div className="page fade-in">
          <div className="empty-state">
            <ShieldAlert size={40} />
            <p>No finding selected. Please create a finding first.</p>
            <button className="btn-primary" onClick={() => navigate('/findings/new')}>
              Create Finding
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Destructure all real backend fields
  const {
    ai_analysis,
    ai_recommendation,
    historical_match,
    historical_matches,
    match_strength,
    learning_context,
    precedent_status,
    what_changed,
    previous_resolution,
    why_relevant,
  } = analysisResult;

  // Similarity from real Hindsight semantic score
  const similarity =
    historical_match?.scores?.semantic != null
      ? Math.round(historical_match.scores.semantic * 100)
      : null;

  // Parse primary match text
  const { id: historicalId, title: historicalTitle } = parseMatchText(historical_match?.text ?? null);

  const handleOpenDialog = () => {
    setResolutionText(ai_recommendation || '');
    setResolutionValidationError(null);
    setResolvingError(null);
    setShowResolveDialog(true);
  };

  const handleCloseDialog = () => {
    if (resolutionState === 'resolving') return;
    
    // Check if user edited the text
    const initialText = ai_recommendation || '';
    if (resolutionText !== initialText) {
      setShowDiscardPrompt(true);
      return;
    }
    
    setShowResolveDialog(false);
  };

  const handleConfirmDiscard = () => {
    setShowDiscardPrompt(false);
    setShowResolveDialog(false);
  };

  const handleConfirmResolution = async () => {
    const trimmed = resolutionText.trim();
    if (!trimmed) {
      setResolutionValidationError('Please enter a resolution before confirming.');
      return;
    }
    
    setResolutionValidationError(null);
    setResolvingError(null);
    setResolutionState('resolving');

    try {
      const res = await analysisService.resolveFinding({
        finding_id: currentFinding.id,
        resolution: trimmed,
      });
      setResolutionState('resolved');
      setCurrentStatus('Resolved');
      setShowResolveDialog(false);
      showToast('Finding resolved successfully.', 'success');
      
      // Update finding if we got fields back
      setResolutionResult({
        resolved_by: res.resolved_by,
        resolved_at: res.resolved_at,
        resolution: trimmed
      });
    } catch (err) {
      setResolvingError(err instanceof Error ? err.message : 'Unable to resolve finding.');
      setResolutionState('open');
      showToast('Unable to resolve finding.', 'error');
    }
  };
  
  const handleKeepOpen = () => setResolutionState('open');

  return (
    <AppShell>
      <div className="page fade-in">

        {/* Page heading */}
        <div className="page-header analysis-header">
          <div>
            <p className="page-eyebrow">Finding Analysis</p>
            <h1 className="page-title">Audit memory surfaced a relevant precedent</h1>
            <p className="page-subtitle">
              AuditTrail AI found a historical finding with a similar control failure and resolution pattern.
            </p>
          </div>
          <div className="breadcrumb">
            <button className="breadcrumb-link" onClick={() => navigate('/')}>Dashboard</button>
            <ChevronRight size={14} />
            <button className="breadcrumb-link" onClick={() => navigate('/findings/new')}>Findings</button>
            <ChevronRight size={14} />
            <span>Analysis</span>
          </div>
        </div>

        <div className="analysis-layout">

          {/* ══ LEFT COLUMN ══════════════════════════════════════════════════ */}
          <div className="analysis-left">

            {/* Current Finding */}
            <div className="analysis-card">
              <div className="card-label">
                <FolderOpen size={14} />
                Current Finding
              </div>
              <div className="current-finding-meta">
                <span className="finding-id-lg">{currentFinding.id ?? 'A-NEW'}</span>
                <SeverityBadge severity={currentFinding.severity} />
                <StatusBadge status={currentStatus} />
              </div>
              <h3 className="current-finding-title">{currentFinding.title}</h3>
              <p className="current-finding-desc">{currentFinding.description}</p>
              {currentFinding.regulation && (
                <div className="finding-meta-row">
                  <span className="meta-label">Regulation</span>
                  <span className="meta-value mono">{currentFinding.regulation}</span>
                </div>
              )}
              <div className="finding-meta-row">
                <span className="meta-label">Category</span>
                <span className="meta-value">{currentFinding.category}</span>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="analysis-card">
              <div className="card-label">
                <Sparkles size={14} />
                AI Analysis
              </div>
              <p className="ai-analysis-text">{ai_analysis}</p>
            </div>

            {/* ── WHAT CHANGED? ──────────────────────────────────────────── */}
            <div className="analysis-card what-changed-card" id="what-changed">
              <div className="card-label">
                <GitCompare size={14} />
                What Changed?
              </div>
              <p className="what-changed-summary">{what_changed.summary}</p>

              <div className="bool-chips-row">
                <BoolChip value={what_changed.same_category} label="Same category" />
                {/* same_root_cause is always null per backend — omit when null */}
                <BoolChip value={what_changed.same_root_cause} label="Same root cause" />
              </div>

              <div className="compare-grid">
                <div className="compare-header">
                  <span className="compare-col-label">Current</span>
                  <span />
                  <span className="compare-col-label">Historical</span>
                </div>
                <CompareRow
                  label="Status"
                  current={what_changed.current_status}
                  historical={what_changed.historical_status}
                />
                {what_changed.previous_resolution && (
                  <div className="wc-resolution-row">
                    <span className="compare-label">Previous resolution</span>
                    <span className="wc-resolution-value">
                      {what_changed.previous_resolution}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="recommendation-card" id="ai-recommendation" style={{ marginBottom: '24px' }}>
              <div className="card-label">
                <Sparkles size={14} />
                AI Recommendation
              </div>
              <p className="ai-recommendation-label">
                AI-generated recommendation based on this finding and historical organizational memory.
              </p>
              <p className="rec-text">{ai_recommendation}</p>
            </div>

            {/* Human Decision */}
            <div className="resolution-section" style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', background: 'var(--surface-0)' }}>
              <div className="card-label" style={{ marginBottom: '16px' }}>
                <CheckCircle2 size={14} />
                Human Decision
              </div>

              {resolutionState === 'resolved' ? (
                <div className="success-state" id="success-state" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={22} className="success-icon" />
                    <div>
                      <p className="success-title">Human confirmed/resolved.</p>
                      <p className="success-sub">Decision stored in Hindsight</p>
                    </div>
                  </div>
                  {resolutionResult && (
                    <div style={{ background: 'var(--surface-1)', padding: '12px', borderRadius: '6px', width: '100%', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {resolutionResult.resolved_by && (
                        <div><strong>Resolved by:</strong> {resolutionResult.resolved_by}</div>
                      )}
                      {resolutionResult.resolved_at && (
                        <div><strong>Resolved at:</strong> {formatDate(resolutionResult.resolved_at)}</div>
                      )}
                      {resolutionResult.resolution && (
                        <div><strong>Resolution:</strong> {resolutionResult.resolution}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="action-buttons">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Status: <strong>Awaiting human decision</strong>
                    </p>
                  </div>
                  <button id="btn-mark-resolved" className="btn-primary" onClick={handleOpenDialog}>
                    <CheckCircle2 size={16} />
                    Mark Resolved
                  </button>
                  <button id="btn-keep-open" className="btn-secondary" onClick={handleKeepOpen}>
                    Keep Open
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════ */}
          <div className="analysis-right">

            {/* ── AUDIT DÉJÀ VU ─────────────────────────────────────────── */}
            <div className="dejaVu-card" id="audit-dejaVu">
              <div className="dejaVu-header">
                <div className="dejaVu-icon-wrap">
                  <Brain size={20} />
                </div>
                <div>
                  <p className="dejaVu-eyebrow">🧠 AUDIT DÉJÀ VU</p>
                  <p className="dejaVu-sub">{precedent_status ?? 'Institutional memory found'}</p>
                </div>
              </div>

              {/* Match strength pill */}
              {match_strength && (
                <div className="match-strength-row">
                  <span className="match-strength-label">{match_strength} (Product Signal)</span>
                </div>
              )}

              {/* Similarity ring */}
              {similarity !== null ? (
                <div className="similarity-block">
                  <div className="similarity-ring">
                    <svg viewBox="0 0 80 80" className="ring-svg">
                      <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#4F46E5" />
                          <stop offset="100%" stopColor="#818CF8" />
                        </linearGradient>
                      </defs>
                      <circle cx="40" cy="40" r="34" className="ring-track" />
                      <circle
                        cx="40" cy="40" r="34"
                        className="ring-fill"
                        stroke="url(#ringGrad)"
                        strokeDasharray={`${(similarity / 100) * 213.6} 213.6`}
                        strokeDashoffset="0"
                      />
                    </svg>
                    <div className="ring-label">
                      <span className="ring-pct" id="similarity-pct">{similarity}%</span>
                      <span className="ring-text">Similarity</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="similarity-block">
                  <p className="no-match-text">No historical precedent found.</p>
                </div>
              )}

              <div className="dejaVu-divider" />

              {/* Historical finding details */}
              {historical_match ? (
                <>
                  <div className="dejaVu-section">
                    <div className="card-label">
                      <BookOpen size={13} />
                      Similar Historical Finding
                    </div>
                    <div className="hist-id-row">
                      {historicalId && <span className="finding-id">{historicalId}</span>}
                    </div>
                    {historicalTitle && <p className="hist-title">{historicalTitle}</p>}
                  </div>

                  <div className="dejaVu-detail-grid">
                    {historicalTitle && (
                      <div className="detail-row">
                        <span className="detail-label">Previous issue</span>
                        <span className="detail-value">{historicalTitle}</span>
                      </div>
                    )}
                    {previous_resolution && (
                      <div className="detail-row">
                        <span className="detail-label">Previous resolution</span>
                        <span className="detail-value highlight" id="previous-resolution">
                          {previous_resolution}
                        </span>
                      </div>
                    )}
                  </div>

                  {why_relevant && (
                    <div className="dejaVu-why">
                      <p className="why-label">Why this matters</p>
                      <p className="why-text">{why_relevant}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="dejaVu-section">
                  <p className="no-match-text">
                    No similar historical finding was retrieved from organizational memory.
                  </p>
                </div>
              )}
            </div>

            {/* ── MEMORY EVIDENCE ────────────────────────────────────────── */}
            <div className="analysis-card memory-evidence-card" id="memory-evidence">
              <div className="card-label">
                <Database size={14} />
                Memory Evidence
              </div>
              <div className="memory-evidence-body">
                <div className="memory-stat">
                  <div className="memory-stat-icon">
                    {learning_context.memory_used
                      ? <ShieldCheck size={20} className="mem-icon-yes" />
                      : <ShieldAlert size={20} className="mem-icon-no" />}
                  </div>
                  <div>
                    <p className="memory-stat-label">Hindsight Memory</p>
                    <p className={`memory-stat-value ${learning_context.memory_used ? 'mem-yes' : 'mem-no'}`}>
                      {learning_context.memory_used ? 'Historical organizational memory informed this analysis.' : 'No memories retrieved'}
                    </p>
                  </div>
                </div>
                <div className="memory-count-block">
                  <span className="memory-count-num">{learning_context.historical_memories_retrieved}</span>
                  <span className="memory-count-label">historical{' '}
                    {learning_context.historical_memories_retrieved === 1 ? 'memory' : 'memories'} retrieved</span>
                </div>
              </div>
            </div>

            {/* ── HISTORICAL MATCHES ─────────────────────────────────────── */}
            <div className="analysis-card" id="historical-matches">
              <div className="card-label">
                <Layers size={14} />
                Historical Matches
                {historical_matches.length > 0 && (
                  <span className="matches-count-badge">{historical_matches.length}</span>
                )}
              </div>

              {historical_matches.length === 0 ? (
                <div className="hist-matches-empty">
                  <p className="no-match-text">
                    No historical matches were returned from Hindsight memory.
                  </p>
                </div>
              ) : (
                <div className="hist-matches-list">
                  {historical_matches.map((m, i) => (
                    <MatchRow key={m.id ?? i} match={m} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Left AI recommendation was moved to left col. */}

          </div>
        </div>
      </div>
      
      {/* ── RESOLUTION DIALOG ───────────────────────────────────────────── */}
      {showResolveDialog && (
        <div className="modal-overlay" onKeyDown={(e) => { if (e.key === 'Escape' && resolutionState !== 'resolving') handleCloseDialog(); }}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="modal-header">
              <h2 id="dialog-title" className="modal-title">Resolve Finding?</h2>
              <button className="modal-close" onClick={handleCloseDialog} aria-label="Close dialog" disabled={resolutionState === 'resolving'}>
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Please confirm the human decision to resolve this finding.
              </p>
              
              <div style={{ background: 'var(--surface-1)', padding: '12px', borderRadius: '6px', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} /> AI-generated recommendation
                </div>
                <div style={{ fontSize: '13px' }}>{ai_recommendation}</div>
              </div>

              {resolvingError && (
                <div className="error-banner" role="alert">
                  <AlertCircle size={16} className="error-banner-icon" />
                  <span>{resolvingError}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Resolution
                </label>
                <textarea
                  className="dialog-textarea"
                  value={resolutionText}
                  onChange={(e) => {
                    setResolutionText(e.target.value);
                    if (resolutionValidationError) setResolutionValidationError(null);
                  }}
                  disabled={resolutionState === 'resolving'}
                  aria-label="Resolution text"
                />
                {resolutionValidationError && (
                  <div className="form-error">
                    <AlertCircle size={14} /> {resolutionValidationError}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseDialog} disabled={resolutionState === 'resolving'}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={resolvingError ? handleConfirmResolution : handleConfirmResolution} 
                disabled={resolutionState === 'resolving'}
              >
                {resolutionState === 'resolving' ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Resolving...
                  </>
                ) : resolvingError ? (
                  'Retry'
                ) : (
                  'Confirm Resolution'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISCARD DIALOG ───────────────────────────────────────────── */}
      {showDiscardPrompt && (
        <div className="modal-overlay">
          <div className="modal-content" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">Discard this resolution?</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                You have unsaved changes. Are you sure you want to discard them?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDiscardPrompt(false)}>
                Keep Editing
              </button>
              <button className="btn-primary" style={{ background: 'var(--error)' }} onClick={handleConfirmDiscard}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
