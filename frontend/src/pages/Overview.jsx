import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
} from '../api/freightService';
import { forecastUrlForRoute } from '../api/forecastParams';



export default function Overview() {
 const [kpis, setKpis] = useState(null);
 const [routes, setRoutes] = useState([]);
 const [recommendations, setRecommendations] = useState([]);
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
 setLoading(false);
 });
 }, []);

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

 {/* KPI Row — BDI/VLSFO share their detail pages' data source and periods */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
 <MetricCard
 label="Baltic Dry Index"
 value={Number(kpis.baltic_dry_index.value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
 unit="points"
 changePct={kpis.baltic_dry_index.change_pct}
 trend={kpis.baltic_dry_index.trend}
 subtitle={`As of ${kpis.baltic_dry_index.date} · Capesize ${Number(kpis.baltic_dry_index.components.capesize).toLocaleString()}`}
 disableGraph={true}
 linkTo="/rates/bdi"
 />
 <MetricCard
 label="VLSFO Singapore"
 value={`$${Number(kpis.bunker_fuel.vlsfo_singapore.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
 unit="/MT"
 changePct={kpis.bunker_fuel.vlsfo_singapore.change_pct}
 trend={kpis.bunker_fuel.vlsfo_singapore.change_pct < 0 ? 'down' : 'up'}
 subtitle={`As of ${kpis.bunker_fuel.vlsfo_singapore.date} · Fujairah $${kpis.bunker_fuel.vlsfo_fujairah.value}/MT`}
 disableGraph={true}
 linkTo="/rates/vlsfo"
 />
 <MetricCard
 icon={TrendingUp}
 label="90-Day Rate Projection"
 value={`${kpis.rate_projection_90d.direction === 'up' ? '↑' : '↓'} ${kpis.rate_projection_90d.magnitude_pct}%`}
 subtitle="Forecast across all routes"
 disableGraph={true}
 linkTo="/rates/forecast"
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
 <Link
 key={route.id}
 to={forecastUrlForRoute(route.id)}
 aria-label={`Open forecast for ${route.origin_port} to ${route.destination_port}, ${route.primary_cargo}`}
 className="w-full text-left p-3 border rounded-xl transition-all duration-200 bg-white border-slate-100 hover:border-teal-300 hover:bg-teal-50/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-teal-500 group"
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-semibold text-slate-800 group-hover:text-teal-800">
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
 <span className="text-xs font-medium text-teal-700 inline-flex items-center gap-1">
 View forecast <ArrowRight className="w-3 h-3" />
 </span>
 </div>
 </Link>
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
