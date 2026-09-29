import { useEffect, useState, useMemo } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { analysisService } from '../services/analysisService';
import type { MemoryUnit } from '../types/finding';
import { AlertCircle, Clock, Loader2, Brain, Tag } from 'lucide-react';

export function MemoryTimeline() {
  const [memories, setMemories] = useState<MemoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchMemories() {
      try {
        const res = await analysisService.getMemory();
        if (mounted) {
          setMemories(res.memories || []);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load Hindsight memory.');
          setLoading(false);
        }
      }
    }
    fetchMemories();
    return () => { mounted = false; };
  }, []);

  const sortedMemories = useMemo(() => {
    // Ensure chronological / reverse-chronological order (newest first for timeline)
    return [...memories].sort((a, b) => {
      const timeA = a.occurred_at ? new Date(a.occurred_at).getTime() : 0;
      const timeB = b.occurred_at ? new Date(b.occurred_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [memories]);

  return (
    <AppShell>
      <div className="page fade-in">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">AuditTrail AI</p>
            <h1 className="page-title">Hindsight Memory Timeline</h1>
            <p className="page-subtitle">
              Chronological log of facts and resolutions permanently retained in Hindsight.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="ledger-state-box">
            <Loader2 size={24} className="spin text-muted" />
            <p>Loading memory...</p>
          </div>
        ) : error ? (
          <div className="ledger-state-box error">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        ) : sortedMemories.length === 0 ? (
          <div className="ledger-state-box">
            <Clock size={24} className="text-muted" />
            <p>No organizational memories recorded yet.</p>
          </div>
        ) : (
          <div className="timeline-container">
            {sortedMemories.map((mem) => {
              const dateObj = mem.occurred_at ? new Date(mem.occurred_at) : null;
              const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Unknown Time';

              const isDecision = mem.text?.includes('resolved by') && mem.text?.includes('Resolution:');

              return (
                <div key={mem.id || Math.random().toString()} className="timeline-item">
                  <div className="timeline-marker">
                    {isDecision ? <Brain size={14} className="text-indigo" /> : <div className="timeline-dot" />}
                  </div>
                  
                  <div className={`timeline-content ${isDecision ? 'is-decision' : ''}`}>
                    <div className="timeline-header">
                      <span className="timeline-date">{dateStr}</span>
                      <span className="timeline-id">{mem.id}</span>
                    </div>

                    <p className="timeline-text">{mem.text}</p>
                    
                    <div className="timeline-meta">
                      {mem.state && <span className="timeline-badge state">{mem.state}</span>}
                      {mem.fact_type && <span className="timeline-badge fact">{mem.fact_type}</span>}
                      {isDecision && <span className="timeline-badge decision">Resolution Decision</span>}
                      
                      {mem.tags && mem.tags.length > 0 && (
                        <div className="timeline-tags">
                          <Tag size={12} />
                          {mem.tags.map((t, idx) => (
                            <span key={idx} className="timeline-tag">{t}</span>
                          ))}
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
