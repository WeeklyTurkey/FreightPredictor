import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Activity, Fuel } from 'lucide-react';
import { getMarketIndexHistory, getBunkerFuelHistory } from '../api/freightService';
import Navbar from '../components/Navbar';
import MetricCard from '../components/MetricCard';

const formatTick = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const CustomTooltip = ({ active, payload, label, unit }) => {
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

const IndexGraph = () => {
  const [searchParams] = useSearchParams();
  const indexType = searchParams.get('type') || 'BDI'; // BDI or VLSFO
  const [fullData, setFullData] = useState([]);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('1M'); // 1W, 1M, ALL
  const [loading, setLoading] = useState(true);

  const isVlsfo = indexType === 'VLSFO';
  const title = isVlsfo ? 'VLSFO Bunker Fuel Price' : 'Baltic Dry Index';
  const unit = isVlsfo ? '$/MT' : 'points';
  const accent = 'teal';
  const strokeColor = '#0d9488';
  const gradientColor = '#0d9488';
  const IconComp = isVlsfo ? Fuel : Activity;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let rawData = [];
      if (isVlsfo) {
        rawData = await getBunkerFuelHistory(9999);
      } else {
        rawData = await getMarketIndexHistory(indexType, 9999);
      }
      setFullData(rawData);
      setLoading(false);
    };

    fetchData();
  }, [indexType]);

  // Apply filter whenever fullData or filter changes
  useEffect(() => {
    if (fullData.length === 0) return;
    let filtered = [];
    if (filter === '1W') {
      filtered = fullData.slice(-7);
    } else if (filter === '1M') {
      filtered = fullData.slice(-30);
    } else {
      filtered = fullData;
    }
    setData(filtered);
  }, [fullData, filter]);

  // Latest value for MetricCard
  const latest = data.length > 0 ? data[data.length - 1] : null;
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const changePct = latest && prev && prev.value
    ? Math.round(((latest.value - prev.value) / prev.value) * 1000) / 10
    : null;

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
          <p className="text-sm text-slate-400 mt-1">Historical trends and raw index data</p>
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
            {/* KPI card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                icon={IconComp}
                label={title}
                value={latest ? (isVlsfo ? `$${Number(latest.value).toFixed(2)}` : Number(latest.value).toLocaleString()) : '—'}
                unit={unit}
                changePct={changePct}
                trend={changePct == null ? 'flat' : changePct >= 0 ? 'up' : 'down'}
                subtitle={latest?.date ? `As of ${latest.date}` : 'No data'}
                disableGraph={true}
              />
            </div>

            {/* Chart card */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Daily history
                </h3>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {['1W', '1M', 'ALL'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        filter === f
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {data.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-sm text-slate-400">
                  No historical values available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-${indexType}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={gradientColor} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatTick}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      // Auto-space ticks
                      interval="preserveStartEnd"
                      minTickGap={50}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      domain={['auto', 'auto']}
                      width={60}
                      tickFormatter={(val) => isVlsfo ? `$${val}` : val.toLocaleString()}
                    />
                    <Tooltip content={<CustomTooltip unit={unit} />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={strokeColor}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={`url(#gradient-${indexType})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default IndexGraph;
