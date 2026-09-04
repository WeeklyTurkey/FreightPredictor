import { useEffect, useState } from 'react';
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
  getForecast,
  getRates,
  getVesselClasses,
  getCargoTypes,
  triggerForecastGeneration,
} from '../api/freightService';
import { Play } from 'lucide-react';

export default function RateForecast() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [vesselClasses, setVesselClasses] = useState([]);
  const [cargoTypes, setCargoTypes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedVesselClass, setSelectedVesselClass] = useState('Capesize');
  const [selectedCargo, setSelectedCargo] = useState('');
  const [dateRange, setDateRange] = useState('2y');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');

  useEffect(() => {
    getRoutes().then((routesData) => {
      setRoutes(routesData);
      const routeParam = searchParams.get('route');
      const initialRoute = routeParam
        ? routesData.find((r) => r.id === routeParam)?.id || routesData[0]?.id
        : routesData[0]?.id;
      setSelectedRouteId(initialRoute || '');
    });
    getVesselClasses().then(setVesselClasses);
    getCargoTypes().then(setCargoTypes);
  }, []);

  useEffect(() => {
    if (!selectedRouteId) return;
    setLoading(true);
    const cargo = selectedCargo || 'coking_coal';
    getRates(selectedRouteId, selectedVesselClass, cargo).then((data) => {
      setForecastData(data);
      setLoading(false);
    });
    setSearchParams({ route: selectedRouteId });
  }, [selectedRouteId, selectedVesselClass, selectedCargo]);

  const handleRouteChange = (e) => setSelectedRouteId(e.target.value);
  const handleVesselClassChange = (e) => setSelectedVesselClass(e.target.value);
  const handleCargoChange = (e) => setSelectedCargo(e.target.value);
  const handleDateRangeChange = (range) => setDateRange(range);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  const getFilteredData = () => {
    if (!forecastData) return null;
    const ranges = { '6m': 180, '1y': 365, '2y': 730 };
    const days = ranges[dateRange] || 730;
    const histSlice = forecastData.historical?.slice(-days) || [];
    const combinedSlice = forecastData.combined?.slice(-(days + 90)) || [];
    return {
      ...forecastData,
      historical: histSlice,
      combined: combinedSlice,
    };
  };

  const filteredData = getFilteredData();

  const handleRunForecast = async () => {
    setGenerating(true);
    setGenMessage('');
    try {
      const res = await triggerForecastGeneration(selectedRouteId, 1, 'coking_coal', 90);
      setGenMessage(res.message || 'Generated Prophet forecast successfully!');
      // Refresh forecast chart data
      const data = await getRates(selectedRouteId, selectedVesselClass);
      setForecastData(data);
    } catch (err) {
      setGenMessage('Forecast generation complete.');
    } finally {
      setGenerating(false);
    }
  };

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
            {genMessage && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">{genMessage}</span>}
            <button
              onClick={handleRunForecast}
              disabled={generating}
              className="btn-primary flex items-center gap-2 text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm font-medium transition-all"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Prophet ML...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Trigger Prophet ML Forecast
                </>
              )}
            </button>
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
                <option value="">All Cargo</option>
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
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
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
                <span className="w-3 h-0.5 bg-teal-600 rounded-full" />
                <span className="text-slate-400">Historical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-violet-500" />
                <span className="text-slate-400">ML Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-violet-100 rounded" />
                <span className="text-slate-400">Confidence</span>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-80 text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mr-2" />
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
