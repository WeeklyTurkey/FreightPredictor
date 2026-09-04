import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Fuel,
  Ship,
  TrendingUp,
  ArrowRight,
  MapPin,
  Navigation,
} from 'lucide-react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Navbar from '../components/Navbar';
import MetricCard from '../components/MetricCard';
import RecommendationCard from '../components/RecommendationCard';
import {
  getMarketKPIs,
  getRoutes,
  getRecommendations,
  getForecast,
} from '../api/freightService';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const tickerMiniTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2 text-xs shadow-lg">
      <p className="text-slate-400 mb-1">{formatDate(label)}</p>
      <p className="text-teal-600 font-semibold font-mono">${payload[0].value.toFixed(2)}/MT</p>
    </div>
  );
};

export default function Overview() {
  const [kpis, setKpis] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMarketKPIs(),
      getRoutes(),
      getRecommendations(),
    ]).then(([kpisData, routesData, recsData]) => {
      setKpis(kpisData);
      setRoutes(routesData);
      setRecommendations(recsData);
      setSelectedRoute(routesData[0]);
      getForecast(routesData[0].id).then(setForecastData);
      setLoading(false);
    });
  }, []);

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    getForecast(route.id).then(setForecastData);
  };

  if (loading || !kpis) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading overview...
          </div>
        </div>
      </div>
    );
  }

  const topRec = recommendations[0];
  const miniChartData = forecastData?.historical?.slice(-26).map((h) => ({
    date: h.date,
    rate: h.rate,
  })) || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pipeline Overview</h2>
          <p className="text-sm text-slate-400 mt-1">High-level market analytics & predictive insights</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={Activity}
            label="Baltic Dry Index"
            value={kpis.baltic_dry_index.value.toLocaleString()}
            unit="$/day"
            changePct={kpis.baltic_dry_index.change_pct}
            trend={kpis.baltic_dry_index.trend}
            accent="teal"
            subtitle={`Capesize: ${kpis.baltic_dry_index.components.capesize.toLocaleString()}`}
          />
          <MetricCard
            icon={Fuel}
            label="VLSFO Singapore"
            value={`$${kpis.bunker_fuel.vlsfo_singapore.value}`}
            unit="/MT"
            changePct={kpis.bunker_fuel.vlsfo_singapore.change_pct}
            trend={kpis.bunker_fuel.vlsfo_singapore.change_pct < 0 ? 'down' : 'up'}
            accent="amber"
            subtitle={`Fujairah: $${kpis.bunker_fuel.vlsfo_fujairah.value}/MT`}
          />
          <MetricCard
            icon={Ship}
            label="Active Shipments"
            value={kpis.active_shipments}
            unit="voyages"
            accent="slate"
            subtitle={`${kpis.fleet_readiness.available_vessels}/${kpis.fleet_readiness.total_fleet} vessels ready`}
          />
          <MetricCard
            icon={TrendingUp}
            label="30-Day Rate Projection"
            value={`${kpis.rate_projection_30d.direction === 'up' ? '↑' : '↓'} ${kpis.rate_projection_30d.magnitude_pct}%`}
            accent={kpis.rate_projection_30d.direction === 'up' ? 'rose' : 'emerald'}
            subtitle="Forecast across all routes"
          />
        </div>

        {/* Route Selector + Mini Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Route Selector */}
          <div className="card p-5 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Navigation className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Route Selector</h3>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                    selectedRoute?.id === route.id
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">
                      {route.origin_port} → {route.destination_port}
                    </span>
                    <span className={`text-xs font-semibold ${route.rate_change_pct > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {route.rate_change_pct > 0 ? '↑' : '↓'} {Math.abs(route.rate_change_pct)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{route.origin_country}
                    </span>
                    <span>·</span>
                    <span>{route.primary_cargo}</span>
                    <span>·</span>
                    <span>{route.distance_nm} nm</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mini Rate Chart */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Rate Trend — 26 Weeks</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedRoute?.origin_port} → {selectedRoute?.destination_port} · <span className="font-semibold text-teal-600">${selectedRoute?.current_rate}/MT</span>
                </p>
              </div>
              <Link
                to={`/rates/forecast?route=${selectedRoute?.id}`}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Full Forecast <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={miniChartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="miniRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#94a3b8', fontSize: 10 }} minTickGap={40} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `$${v}`} width={45} />
                <Tooltip content={tickerMiniTooltip} />
                <Area type="monotone" dataKey="rate" stroke="none" fill="url(#miniRate)" />
                <Line type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Recommendation Banner */}
        {topRec && (
          <div className="mb-6">
            <RecommendationCard recommendation={topRec} compact={true} />
          </div>
        )}
      </main>
    </div>
  );
}
