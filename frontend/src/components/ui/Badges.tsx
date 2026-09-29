import type { Severity, Status } from '../../types/finding';

interface SeverityBadgeProps {
  severity: Severity;
}

const severityConfig: Record<Severity, { label: string; className: string }> = {
  Critical: { label: 'Critical', className: 'badge-critical' },
  High: { label: 'High', className: 'badge-high' },
  Medium: { label: 'Medium', className: 'badge-medium' },
  Low: { label: 'Low', className: 'badge-low' },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const cfg = severityConfig[severity] || { label: 'Unknown', className: 'badge-medium' };
  return <span className={`badge ${cfg.className}`}>{cfg.label}</span>;
}

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  Open: { label: 'Open', className: 'status-open' },
  Resolved: { label: 'Resolved', className: 'status-resolved' },
  'In Progress': { label: 'In Progress', className: 'status-progress' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return <span className={`status-badge ${cfg.className}`}>{cfg.label}</span>;
}
