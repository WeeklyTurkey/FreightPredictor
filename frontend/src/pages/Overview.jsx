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

import Navbar from '../components/Navbar';
import MetricCard from '../components/MetricCard';
import RecommendationCard from '../components/RecommendationCard';
import {
 getMarketKPIs,
 getRoutes,
 getRecommendations,
 getForecast,
} from '../api/freightService';



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
 <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
 Loading overview...
 </div>
 </div>
 </div>
 );
 }

 const topRec = recommendations[0];

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
 label="Baltic Dry Index"
 value={kpis.baltic_dry_index.value.toLocaleString()}
 unit="$/day"
 changePct={kpis.baltic_dry_index.change_pct}
 trend={kpis.baltic_dry_index.trend}
 subtitle={`Capesize: ${kpis.baltic_dry_index.components.capesize.toLocaleString()}`}
 chartData={kpis.baltic_dry_index.historical || null}
 disableGraph={true}
 linkTo="/rates/bdi"
 />
 <MetricCard
 label="VLSFO Singapore"
 value={`$${kpis.bunker_fuel.vlsfo_singapore.value}`}
 unit="/MT"
 changePct={kpis.bunker_fuel.vlsfo_singapore.change_pct}
 trend={kpis.bunker_fuel.vlsfo_singapore.change_pct < 0 ? 'down' : 'up'}
 subtitle={`Fujairah: $${kpis.bunker_fuel.vlsfo_fujairah.value}/MT`}
 chartData={kpis.bunker_fuel.vlsfo_singapore.historical || null}
 disableGraph={true}
 linkTo="/rates/vlsfo"
 />
 <MetricCard
 icon={Ship}
 label="Active Shipments"
 value={kpis.active_shipments}
 unit="voyages"
 accent="slate"
 subtitle={`${kpis.fleet_readiness.available_vessels}/${kpis.fleet_readiness.total_fleet} vessels ready`}
 disableGraph={true}
 />
 <MetricCard
 icon={TrendingUp}
 label="30-Day Rate Projection"
 value={`${kpis.rate_projection_30d.direction === 'up' ? '↑' : '↓'} ${kpis.rate_projection_30d.magnitude_pct}%`}
 accent={kpis.rate_projection_30d.direction === 'up' ? 'rose' : 'emerald'}
 subtitle="Forecast across all routes"
 disableGraph={true}
 />
 </div>

 {/* Route Selector */}
 <div className="card p-5 mb-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Navigation className="w-4 h-4 text-teal-600" />
 <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Routes</h3>
 </div>
 <Link to="/rates/graph" className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors bg-teal-50 px-3 py-1.5 rounded-full">
 View Graphs <ArrowRight className="w-3 h-3" />
 </Link>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
 {routes.map((route) => (
 <button
 key={route.id}
 onClick={() => handleRouteSelect(route)}
 className={`w-full text-left p-3 border rounded-xl transition-all duration-200 ${
 selectedRoute?.id === route.id
 ? 'bg-teal-50 border-teal-200 shadow-sm'
 : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-semibold text-slate-800">
 {route.origin_port} → {route.destination_port}
 </span>
 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${route.rate_change_pct > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
 {route.rate_change_pct > 0 ? '↑' : '↓'} {Math.abs(route.rate_change_pct)}%
 </span>
 </div>
 <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
 <span className="flex items-center gap-1">
 <MapPin className="w-3 h-3 text-slate-400" />{route.origin_country}
 </span>
 <span>·</span>
 <span>{route.primary_cargo}</span>
 </div>
 <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
 <span className="text-xs font-medium text-slate-400">{route.distance_nm} nm</span>
 <span className="text-sm font-bold text-teal-700">${route.current_rate}/MT</span>
 </div>
 </button>
 ))}
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
