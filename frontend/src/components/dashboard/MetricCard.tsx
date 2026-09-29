import { type ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  accent?: 'default' | 'danger' | 'warning' | 'success';
  icon?: ReactNode;
}

export function MetricCard({ label, value, accent = 'default', icon }: MetricCardProps) {
  return (
    <div className={`metric-card metric-card--${accent}`}>
      {icon && <div className="metric-icon">{icon}</div>}
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
