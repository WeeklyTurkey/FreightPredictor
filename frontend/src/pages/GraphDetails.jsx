import { useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Database, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getRates, getRoutes } from '../api/freightService';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xl">
      <p className="text-slate-500 mb-2 font-medium text-sm flex items-center gap-2">
        <Calendar className="w-4 h-4" /> {formatDate(label)}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">
          ${payload[0].value.toFixed(2)}
        </span>
        <span className="text-sm font-semibold text-slate-500">/ MT</span>
      </div>
    </div>
  );
};

export default function GraphDetails() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load routes and initial data
  useEffect(() => {
    getRoutes().then((routesData) => {
      setRoutes(routesData);
      if (routesData.length > 0) {
        setSelectedRoute(routesData[0]);
      }
    });
  }, []);

  // Fetch graph data whenever route changes
  useEffect(() => {
    if (!selectedRoute) return;
    setLoading(true);
    getRates(selectedRoute.id).then((res) => {
      // res.historical contains the actual historical data points
      const data = res.historical || [];
      setChartData(data);
      setLoading(false);
    });
  }, [selectedRoute]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    
    // Filter out points with null rate just in case
    const validData = chartData.filter(d => d.rate != null);
    if (validData.length === 0) return null;

    const latest = validData[validData.length - 1];
    const latestDate = new Date(latest.date);

    const calculateChange = (daysBack) => {
      if (validData.length < 2) return { pct: 0, val: latest.rate };
      
      const targetTime = latestDate.getTime() - (daysBack * 24 * 60 * 60 * 1000);
      let closest = validData[0];
      let minDiff = Infinity;
      
      // Find closest prior data point
      for (let i = validData.length - 2; i >= 0; i--) {
        const t = new Date(validData[i].date).getTime();
        const diff = Math.abs(t - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = validData[i];
        }
      }

      let pct = ((latest.rate - closest.rate) / closest.rate) * 100;
      
      // Normalize percentage if the closest data point is not exactly 'daysBack' away
      // (e.g. if we want 1-day change but data is weekly)
      const actualDaysDiff = (latestDate.getTime() - new Date(closest.date).getTime()) / (1000 * 3600 * 24);
      if (actualDaysDiff > 0 && Math.abs(actualDaysDiff - daysBack) > 2) {
        pct = pct * (daysBack / actualDaysDiff);
      }

      return { pct, val: closest.rate };
    };

    return {
      latestRate: latest.rate,
      latestDate: latest.date,
      change1d: calculateChange(1),
      change1w: calculateChange(7),
      change1m: calculateChange(30)
    };
  }, [chartData]);

  const StatBlock = ({ label, change }) => {
    if (!change) return null;
    const isUp = change.pct > 0;
    const TrendIcon = isUp ? TrendingUp : TrendingDown;
    const color = isUp ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';
    
    return (
      <div className={`p-4 rounded-xl border ${color} flex flex-col items-center justify-center flex-1`}>
        <span className="text-sm font-semibold mb-1 opacity-80 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5">
          <TrendIcon className="w-5 h-5" />
          <span className="text-xl font-bold">{Math.abs(change.pct).toFixed(2)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Overview
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-teal-600" />
              Graph Details
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2">
              <Database className="w-4 h-4" /> Connected to Primary Data Source
            </p>
          </div>
          
          {/* Route Selector */}
          <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Route</label>
            <select
              className="w-full p-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium text-slate-700"
              value={selectedRoute?.id || ''}
              onChange={(e) => setSelectedRoute(routes.find(r => String(r.id) === e.target.value))}
            >
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.origin_port} → {r.destination_port}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-400 font-medium">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
              Extracting graph data...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Stats Row */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="card p-6 lg:w-1/3 flex flex-col justify-center">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Rate</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">
                    ${stats?.latestRate?.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-slate-400">/ MT</span>
                </div>
                <p className="text-sm font-medium text-teal-700 bg-teal-50 py-1.5 px-3 rounded-md inline-block w-fit">
                  As of {formatDate(stats?.latestDate)}
                </p>
              </div>

              <div className="card p-6 lg:w-2/3 flex flex-col justify-center">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Historical Performance</p>
                <div className="flex gap-4 w-full">
                  <StatBlock label="1 Day" change={stats?.change1d} />
                  <StatBlock label="1 Week" change={stats?.change1w} />
                  <StatBlock label="1 Month" change={stats?.change1m} />
                </div>
              </div>
            </div>

            {/* Main Graph */}
            <div className="card p-6 h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Rate History Trend</h3>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-teal-600"></div> Rate ($/MT)
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth()+1}/${d.getDate()}`;
                    }} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    tickMargin={12}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    width={50}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#0d9488" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRate)" 
                    activeDot={{ r: 6, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
