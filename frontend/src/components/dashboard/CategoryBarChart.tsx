import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Custom dark tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{payload[0].value} findings</p>
    </div>
  );
};

// Bar opacity steps — more findings = more opaque
const BAR_OPACITIES = [1, 0.85, 0.70, 0.55, 0.40];

export function CategoryBarChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-title">Findings by Category</h3>
        <span className="chart-subtitle">All time</span>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            barCategoryGap="28%"
          >
            <XAxis
              type="number"
              tick={{ fill: '#4B5668', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#8B95A7', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={`rgba(79,110,247,${BAR_OPACITIES[i] ?? 0.35})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
