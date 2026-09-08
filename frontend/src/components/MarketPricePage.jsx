import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Navbar from './Navbar';
import MetricCard from './MetricCard';
import { MARKET_PERIODS, filterHistoryByPeriod } from '../api/freightService';

const formatTick = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const priceTooltip = (unit) => ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2 text-xs shadow-lg">
      <p className="text-slate-400 mb-1">{formatTick(label)}</p>
      <p className="font-semibold font-mono">
        {unit === '$/MT' ? `$${payload[0].value.toFixed(2)}/MT` : payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

export default function MarketPricePage({
  title,
  subtitle,
  unit,
  valuePrefix = '',
  valueSuffix = '',
  decimals = 2,
  accent = 'teal',
  icon,
  fetchLatest,
  fetchHistory,
}) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('ALL');

  const visibleHistory = filterHistoryByPeriod(history, period);

  useEffect(() => {
    Promise.all([fetchLatest(), fetchHistory()]).then(([latestData, historyData]) => {
      setLatest(latestData);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setLoading(false);
    });
  }, [fetchLatest, fetchHistory]);

  const formatValue = (v) =>
    v == null
      ? '—'
      : `${valuePrefix}${Number(v).toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}${valueSuffix}`;

  const isEmpty = !loading && history.length === 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Pipeline Overview
        </Link>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[40vh]">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              Loading {title.toLowerCase()}...
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                icon={icon}
                label={title}
                value={latest ? formatValue(latest.value) : '—'}
                unit={unit}
                changePct={latest?.change_pct ?? undefined}
                trend={latest?.change_pct == null ? 'flat' : latest.change_pct >= 0 ? 'up' : 'down'}
                subtitle={latest?.date ? `As of ${latest.date}` : 'No data'}
                disableGraph={true}
              />
            </div>

            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Daily history
                </h3>
                <div className="flex gap-1.5" role="group" aria-label="History period">
                  {MARKET_PERIODS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPeriod(opt)}
                      aria-pressed={period === opt}
                      className={`px-3 py-1 text-xs font-bold border transition-all focus-visible:outline-2 focus-visible:outline-teal-500 ${
                        period === opt
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {isEmpty ? (
                <div className="flex items-center justify-center h-64 text-sm text-slate-400">
                  No historical values available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={visibleHistory} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatTick}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      minTickGap={50}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      domain={['auto', 'auto']}
                      width={60}
                    />
                    <Tooltip content={priceTooltip(unit)} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={accent === 'teal' ? '#0d9488' : '#0284c7'}
                      strokeWidth={2.5}
                      dot={false}
                      name={title}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
