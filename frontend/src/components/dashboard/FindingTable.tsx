import type { Finding } from '../../types/finding';
import { SeverityBadge, StatusBadge } from '../ui/Badges';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';

interface FindingTableProps {
  findings: Finding[];
  showAnalyzeLink?: boolean;
}

export function FindingTable({ findings, showAnalyzeLink = false }: FindingTableProps) {
  const navigate = useNavigate();
  const { setCurrentFinding, resetAnalysis } = useApp();

  const handleAnalyze = (finding: Finding) => {
    resetAnalysis();
    setCurrentFinding(finding);
    navigate('/findings/new', { state: { prefill: finding } });
  };

  return (
    <div className="finding-table-wrap">
      <table className="finding-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Date</th>
            {showAnalyzeLink && <th></th>}
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id} className="finding-row">
              <td><span className="finding-id">{f.id}</span></td>
              <td className="finding-title-cell">{f.title}</td>
              <td><span className="finding-category">{f.category}</span></td>
              <td><SeverityBadge severity={f.severity} /></td>
              <td><StatusBadge status={f.status} /></td>
              <td className="finding-date">{f.date}</td>
              {showAnalyzeLink && (
                <td>
                  <button
                    className="btn-ghost-sm"
                    onClick={() => handleAnalyze(f)}
                    aria-label={`Analyze finding ${f.id}`}
                  >
                    <ArrowRight size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
