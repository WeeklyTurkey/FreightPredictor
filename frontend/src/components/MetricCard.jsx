import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';

export default function MetricCard({ icon: Icon, label, value, unit, change, changePct, trend, accent = 'teal', subtitle }) {
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);

  const accentColors = {
    teal: { icon: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', stroke: '#0d9488' },
    emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', stroke: '#059669' },
    amber: { icon: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', stroke: '#d97706' },
    rose: { icon: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', stroke: '#e11d48' },
    slate: { icon: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', stroke: '#64748b' },
  };

  const colors = accentColors[accent] || accentColors.teal;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-500' : 'text-slate-400';

  // Generate generic sparkline data for the visual
  const sparklineData = useMemo(() => {
    let baseVal = 100;
    const data = [];
    for (let i = 0; i < 14; i++) {
      baseVal += (trend === 'up' ? 2 : trend === 'down' ? -2 : 0) + (Math.random() - 0.5) * 10;
      data.push({ day: `Day ${i + 1}`, value: baseVal });
    }
    return data;
  }, [trend]);

  return (
    <div className="card card-hover p-5 animate-fade-in transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div 
          onClick={() => setIsGraphExpanded(!isGraphExpanded)}
          className={`p-2.5 rounded-xl ${colors.bg} ${colors.border} border cursor-pointer hover:ring-2 ring-offset-2 transition-all ${accent === 'teal' ? 'ring-teal-200' : accent === 'emerald' ? 'ring-emerald-200' : accent === 'amber' ? 'ring-amber-200' : accent === 'rose' ? 'ring-rose-200' : 'ring-slate-200'}`}
          title="Click to view trend graph"
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {changePct !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            {changePct > 0 ? '+' : ''}{changePct}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 font-mono">{value}</span>
          {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
        </div>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      {isGraphExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-down h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors.stroke} 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={true}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ display: 'none' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}
                formatter={() => [null]} // Hides the value text so it just shows the point
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
