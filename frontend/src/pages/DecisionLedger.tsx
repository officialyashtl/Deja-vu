import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { analysisService } from '../services/analysisService';
import type { MemoryUnit } from '../types/finding';
import { AlertCircle, FileSearch, Library, Loader2, ShieldCheck, User } from 'lucide-react';

function parseLedgerEntry(text: string | null) {
  if (!text) return null;
  // Expected format from POST /resolve backend:
  // "Finding {finding_id} resolved by {resolved_by} at {resolved_at}. Resolution: {resolution}. Status: {status}."
  const match = text.match(/Finding (.*?) resolved by (.*?) at (.*?)\. Resolution: (.*?)\. Status: (.*?)\./);
  if (match) {
    return {
      findingId: match[1],
      resolvedBy: match[2],
      resolvedAt: match[3],
      resolution: match[4],
      status: match[5],
    };
  }
  return null;
}

export function DecisionLedger() {
  const [memories, setMemories] = useState<MemoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchLedger() {
      try {
        const res = await analysisService.getMemory();
        if (mounted) {
          setMemories(res.memories);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load decision history.');
          setLoading(false);
        }
      }
    }
    fetchLedger();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="page fade-in">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">AuditTrail AI</p>
            <h1 className="page-title">Decision Ledger</h1>
            <p className="page-subtitle">
              Immutable record of human resolutions persisted to Hindsight organizational memory.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="ledger-state-box">
            <Loader2 size={24} className="spin text-muted" />
            <p>Loading decision history...</p>
          </div>
        ) : error ? (
          <div className="ledger-state-box error">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="ledger-state-box">
            <Library size={24} className="text-muted" />
            <p>No decisions recorded yet.</p>
          </div>
        ) : (
          <div className="ledger-list">
            {memories.map((mem) => {
              const parsed = parseLedgerEntry(mem.text);
              const dateObj = parsed ? new Date(parsed.resolvedAt) : (mem.occurred_at ? new Date(mem.occurred_at) : null);
              const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '—';

              return (
                <div key={mem.id || Math.random().toString()} className="ledger-card">
                  <div className="ledger-card-header">
                    <div className="ledger-id-block">
                      <FileSearch size={16} className="text-indigo" />
                      <span className="ledger-finding-id">{parsed?.findingId || 'Unknown Finding'}</span>
                    </div>
                    <div className="ledger-meta-block">
                      <span className="ledger-date">{dateStr}</span>
                    </div>
                  </div>
                  
                  <div className="ledger-card-body">
                    <div className="ledger-resolution-block">
                      <span className="ledger-label">Decision</span>
                      <p className="ledger-resolution-text">{parsed?.resolution || mem.text}</p>
                    </div>
                    
                    <div className="ledger-footer">
                      <div className="ledger-author">
                        <User size={12} />
                        <span>{parsed?.resolvedBy || 'System'}</span>
                      </div>
                      {parsed?.status && (
                        <div className="ledger-status-tag">
                          <ShieldCheck size={12} />
                          <span>{parsed.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
