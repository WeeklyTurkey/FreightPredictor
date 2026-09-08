import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
 Filter,
 TrendingUp,
 Calendar,
 Ship,
 Package,
 Download,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import RateChart from '../components/RateChart';
import {
 getRoutes,
 getRates,
 getVesselClasses,
 getCargoTypes,
} from '../api/freightService';
import { matchesSelection, normalizeCommodity, displayCommodity, filterForecastByRange } from '../api/forecastParams';

export default function RateForecast() {
 const [searchParams, setSearchParams] = useSearchParams();
 const [routes, setRoutes] = useState([]);
 const [vesselClasses, setVesselClasses] = useState([]);
 const [cargoTypes, setCargoTypes] = useState([]);
 const [selectedRouteId, setSelectedRouteId] = useState('');
 const [selectedVesselClass, setSelectedVesselClass] = useState('Capesize');
 // Explicit default: every selection must name a real commodity so no
 // silent fallback can substitute another cargo's data.
 const [selectedCargo, setSelectedCargo] = useState('Coking Coal');
 const [dateRange, setDateRange] = useState('2y');
 const [forecastData, setForecastData] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 getRoutes()
 .then((routesData) => {
 setRoutes(routesData);
 const routeParam = searchParams.get('route');
 const initialRoute = routeParam
 ? routesData.find((r) => r.id === routeParam)?.id || routesData[0]?.id
 : routesData[0]?.id;
 setSelectedRouteId(initialRoute || '');
 })
 .catch(() => {
 setRoutes([]);
 setSelectedRouteId('');
 setLoading(false);
 });
 getVesselClasses().then(setVesselClasses).catch(() => setVesselClasses([]));
 getCargoTypes().then(setCargoTypes).catch(() => setCargoTypes([]));
 }, []);

 const selectedRoute = routes.find((r) => r.id === selectedRouteId);

 // Default the cargo selector to the route's own primary cargo (backend
 // history data) whenever the current selection isn't served on this route.
 // Mock routes carry no cargo list, so the default stays untouched there.
 useEffect(() => {
 if (!selectedRoute || !Array.isArray(selectedRoute.cargoes) || selectedRoute.cargoes.length === 0) return;
 if (!selectedRoute.cargoes.includes(normalizeCommodity(selectedCargo))) {
 setSelectedCargo(displayCommodity(selectedRoute.cargoes[0]));
 }
 }, [selectedRoute, selectedCargo]);

 const requestSeq = useRef(0);

 useEffect(() => {
 if (!selectedRouteId) {
 // No route to query (e.g. failed bootstrap): never sit on the spinner.
 setLoading(false);
 return;
 }
 const seq = ++requestSeq.current;
 let cancelled = false;
 const run = async () => {
 setLoading(true);
 setForecastData(null);
 try {
 const cargo = selectedCargo || 'Coking Coal';
 const data = await getRates(selectedRouteId, selectedVesselClass, cargo, 90);
 if (cancelled || seq !== requestSeq.current) return;
 // Render only data tagged for this exact selection.
 if (!matchesSelection(data, { routeId: selectedRouteId, vesselClass: selectedVesselClass, commodity: cargo })) {
 return;
 }
 setForecastData(data);
 } finally {
 if (!cancelled && seq === requestSeq.current) {
 setLoading(false);
 }
 }
 };
 run();
 setSearchParams({ route: selectedRouteId });
 return () => {
 cancelled = true;
 };
 }, [selectedRouteId, selectedVesselClass, selectedCargo]);

 const handleRouteChange = (e) => setSelectedRouteId(e.target.value);
 const handleVesselClassChange = (e) => setSelectedVesselClass(e.target.value);
 const handleCargoChange = (e) => setSelectedCargo(e.target.value);
 const handleDateRangeChange = (range) => setDateRange(range);

 const getFilteredData = () => {
 if (!forecastData) return null;
 // Date-based filtering: works for any point cadence (daily live rows
 // or weekly mock rows). The full forecast tail is always kept so the
 // 90-day projection stays visible in every range.
 const { historical, combined } = filterForecastByRange(
 forecastData.historical,
 forecastData.combined,
 dateRange,
 );
 return {
 ...forecastData,
 historical,
 combined,
 };
 };

 const filteredData = getFilteredData();

 return (
 <div className="min-h-screen">
 <Navbar />
 <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
 <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-2xl font-bold text-slate-900 tracking-tight">ML Rate Forecast</h2>
 <p className="text-sm text-slate-400 mt-1">Historical freight rates with 90-day Prophet forecast projections</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-xs text-slate-400">Auto-refreshes on selection change</span>
 </div>
 </div>

 {/* Filter Bar */}
 <div className="card p-4 mb-6">
 <div className="flex items-center gap-2 mb-3">
 <Filter className="w-4 h-4 text-teal-600" />
 <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Filters</h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
 <div>
 <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
 <Ship className="w-3 h-3" /> Route
 </label>
 <select value={selectedRouteId} onChange={handleRouteChange} className="w-full input-field text-sm">
 {routes.map((route) => (
 <option key={route.id} value={route.id}>
 {route.origin_port} → {route.destination_port}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
 <Ship className="w-3 h-3" /> Vessel Class
 </label>
 <select value={selectedVesselClass} onChange={handleVesselClassChange} className="w-full input-field text-sm">
 {vesselClasses.map((vc) => (
 <option key={vc.id} value={vc.name}>
 {vc.name} ({(vc.dwt / 1000).toFixed(0)}k DWT)
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
 <Package className="w-3 h-3" /> Cargo Type
 </label>
 <select value={selectedCargo} onChange={handleCargoChange} className="w-full input-field text-sm">
 {cargoTypes.map((cargo) => (
 <option key={cargo.id} value={cargo.name}>{cargo.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
 <Calendar className="w-3 h-3" /> Date Range
 </label>
 <div className="flex gap-1">
 {['6m', '1y', '2y'].map((range) => (
 <button
 key={range}
 onClick={() => handleDateRangeChange(range)}
 className={`flex-1 py-2 text-xs font-medium transition-colors ${
 dateRange === range
 ? 'bg-teal-600 text-white'
 : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
 }`}
 >
 {range === '6m' ? '6M' : range === '1y' ? '1Y' : '2Y'}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Route Info Bar */}
 {selectedRoute && (
 <div className="card p-4 mb-6 flex flex-wrap items-center gap-6">
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Route</p>
 <p className="text-base font-semibold text-slate-900">{selectedRoute.origin_port} → {selectedRoute.destination_port}</p>
 </div>
 <div className="h-8 w-px bg-slate-200" />
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Distance</p>
 <p className="text-base font-semibold text-slate-900 font-mono">{selectedRoute.distance_nm} nm</p>
 </div>
 <div className="h-8 w-px bg-slate-200" />
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Transit Time</p>
 <p className="text-base font-semibold text-slate-900 font-mono">{selectedRoute.avg_transit_days} days</p>
 </div>
 <div className="h-8 w-px bg-slate-200" />
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Primary Cargo</p>
 <p className="text-base font-semibold text-slate-900">{selectedRoute.primary_cargo}</p>
 </div>
 <div className="h-8 w-px bg-slate-200" />
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Current Rate</p>
 <p className="text-base font-semibold text-teal-600 font-mono">${selectedRoute.current_rate}/MT</p>
 </div>
 {/* <div className="ml-auto">
 <button className="btn-secondary flex items-center gap-2 text-sm">
 <Download className="w-4 h-4" /> Export
 </button>
 </div> */}
 </div>
 )}

 {/* Now-graphing summary: exactly what the chart below renders */}
 {selectedRoute && forecastData && !forecastData.isEmpty && (
 <div className="card p-4 mb-6 border-teal-200 bg-teal-50/40">
 <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
 <div>
 <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Now graphing</p>
 <p className="text-base font-bold text-slate-900">{selectedRoute.origin_port} → {selectedRoute.destination_port}</p>
 </div>
 <div>
 <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Cargo</p>
 <p className="text-base font-bold text-teal-700">{selectedCargo || '—'}</p>
 </div>
 <div>
 <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Vessel class</p>
 <p className="text-base font-semibold text-slate-800">{selectedVesselClass}</p>
 </div>
 <div>
 <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Horizon</p>
 <p className="text-base font-semibold text-slate-800 font-mono">90-day</p>
 </div>
 {(forecastData.forecast || []).length > 0 && (
 <div className="ml-auto">
 <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Model confidence</p>
 <p className="text-base font-bold text-slate-900 font-mono">{((forecastData.confidence || 0) * 100).toFixed(0)}%</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Explicit empty state: never another combination's data */}
 {!loading && (!forecastData || forecastData.isEmpty) && (
 <div className="card p-4 mb-6 border-amber-200 bg-amber-50/60">
 <p className="text-xs text-amber-700">
 No freight-rate data is available for this vessel and cargo combination.
 </p>
 </div>
 )}

 {/* Empty-forecast notice: history exists but no saved 90-day forecast */}
 {!loading && forecastData && !forecastData.isEmpty && (!forecastData.forecast || forecastData.forecast.length === 0) && (
 <div className="card p-4 mb-6 border-amber-200 bg-amber-50/60">
 <p className="text-xs text-amber-700">
 Historical rates are shown, but no saved 90-day forecast exists for this route / vessel / cargo combination yet.
 </p>
 </div>
 )}

 {/* Main Chart */}
 <div className="card p-5 mb-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-teal-600" />
 <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
 Freight Rate History & 90-Day Forecast
 </h3>
 </div>
 <div className="flex items-center gap-4 text-xs">
 <div className="flex items-center gap-1.5">
 <span className="w-3 h-0.5 bg-teal-600 -full" />
 <span className="text-slate-400">Historical</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="w-3 h-0.5 border-t-2 border-dashed border-violet-500" />
 <span className="text-slate-400">ML Forecast</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="w-3 h-2 bg-violet-100 " />
 <span className="text-slate-400">Confidence</span>
 </div>
 </div>
 </div>
 {loading ? (
 <div className="flex items-center justify-center h-80 text-slate-400">
 <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent -full animate-spin mr-2" />
 Loading forecast data...
 </div>
 ) : (
 <RateChart data={filteredData} height={400} showBreakdown={true} />
 )}
 </div>
 </main>
 </div>
 );
}
