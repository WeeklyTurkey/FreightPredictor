import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(2)}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="text-slate-400 font-medium mb-2">{formatDate(label)}</p>
      {data.rate != null && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-teal-600">Historical Rate</span>
          <span className="text-slate-900 font-semibold font-mono">${data.rate.toFixed(2)}/MT</span>
        </div>
      )}
      {data.forecast != null && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-violet-600">ML Forecast</span>
          <span className="text-slate-900 font-semibold font-mono">${data.forecast.toFixed(2)}/MT</span>
        </div>
      )}
      {data.upper_bound != null && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-slate-400">Upper Bound</span>
          <span className="text-slate-600 font-mono">${data.upper_bound.toFixed(2)}/MT</span>
        </div>
      )}
      {data.lower_bound != null && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Lower Bound</span>
          <span className="text-slate-600 font-mono">${data.lower_bound.toFixed(2)}/MT</span>
        </div>
      )}
    </div>
  );
};

export default function RateChart({ data, height = 380, showBreakdown = false }) {
  if (!data || !data.combined) return null;

  const lastHistoricalDate = data.historical?.[data.historical.length - 1]?.date;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data.combined} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="confInterval" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="histRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#e2e8f0' }}
            axisLine={{ stroke: '#e2e8f0' }}
            minTickGap={50}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#e2e8f0' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(v) => `$${v}`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="line"
          />

          {/* Confidence interval shading */}
          <Area type="monotone" dataKey="upper_bound" stroke="none" fill="url(#confInterval)" name="Confidence Upper" legendType="none" />
          <Area type="monotone" dataKey="lower_bound" stroke="none" fill="#ffffff" name="Confidence Lower" legendType="none" />

          {/* Historical rate line */}
          <Line type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={2.5} dot={false} name="Historical Rate ($/MT)" connectNulls={false} />

          {/* Forecast line (dashed) */}
          <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="6 4" dot={false} name="ML Forecast ($/MT)" connectNulls={false} />

          {/* Upper/lower bound lines */}
          <Line type="monotone" dataKey="upper_bound" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Upper Bound" connectNulls={false} opacity={0.3} />
          <Line type="monotone" dataKey="lower_bound" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Lower Bound" connectNulls={false} opacity={0.3} />

          {/* Vertical reference line at forecast start */}
          {lastHistoricalDate && (
            <ReferenceLine
              x={lastHistoricalDate}
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              label={{ value: 'Forecast →', position: 'top', fill: '#94a3b8', fontSize: 11 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {showBreakdown && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Latest Historical Rate</p>
            <p className="text-lg font-bold text-teal-600 font-mono">
              ${data.historical?.[data.historical.length - 1]?.rate?.toFixed(2) || '—'}/MT
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">90-Day Forecast</p>
            <p className="text-lg font-bold text-violet-600 font-mono">
              ${data.forecast?.[data.forecast.length - 1]?.predictedRate?.toFixed(2) || '—'}/MT
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Model Confidence</p>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {((data.confidence || 0.85) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
