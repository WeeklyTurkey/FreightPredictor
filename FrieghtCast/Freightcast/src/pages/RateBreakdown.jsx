import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  Table,
  Ship,
  Calendar,
  Package,
  Calculator,
  DollarSign,
  TrendingUp,
  Fuel,
  Anchor,
  ShieldAlert,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import {
  getRoutes,
  getRates,
  getVesselClasses,
  getCargoTypes,
  calculateCostBreakdown,
} from '../api/freightService';

export default function RateBreakdown() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [vesselClasses, setVesselClasses] = useState([]);
  const [cargoTypes, setCargoTypes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedVesselClass, setSelectedVesselClass] = useState('Capesize');
  const [selectedCargo, setSelectedCargo] = useState('coking_coal');
  const [dateRange, setDateRange] = useState('6m');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Landed Cost Calculation state
  const [volumeMt, setVolumeMt] = useState(150000);
  const [costResult, setCostResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

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
    getRates(selectedRouteId, selectedVesselClass, selectedCargo).then((data) => {
      setForecastData(data);
      setLoading(false);
    });
    setSearchParams({ route: selectedRouteId });
  }, [selectedRouteId, selectedVesselClass, selectedCargo]);

  const handleCalculateCost = async () => {
    setCalcLoading(true);
    try {
      const result = await calculateCostBreakdown(
        selectedRouteId || 1,
        selectedVesselClass === 'Capesize' ? 3 : selectedVesselClass === 'Panamax' ? 2 : 1,
        selectedCargo || 'coking_coal',
        volumeMt
      );
      setCostResult(result);
    } catch (err) {
      console.error('Cost calculation failed:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleRouteChange = (e) => setSelectedRouteId(e.target.value);
  const handleVesselClassChange = (e) => setSelectedVesselClass(e.target.value);
  const handleCargoChange = (e) => setSelectedCargo(e.target.value);
  const handleDateRangeChange = (range) => setDateRange(range);

  const getFilteredData = () => {
    if (!forecastData) return [];
    const ranges = { '3m': 13, '6m': 26, '1y': 52, '2y': 104 };
    const weeks = ranges[dateRange] || 26;
    return forecastData.historical?.slice(-weeks).reverse() || [];
  };

  const breakdownData = getFilteredData();

  if (loading && routes.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading rate breakdown...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Rate Breakdown & Landed Cost</h2>
          <p className="text-sm text-slate-400 mt-1">Itemised landed cost calculation engine & historical BAF breakdown</p>
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
                <option value="coking_coal">Coking Coal</option>
                <option value="non_coking_coal">Non-Coking Coal</option>
                <option value="iron_ore">Iron Ore</option>
                <option value="limestone">Limestone</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date Range
              </label>
              <div className="flex gap-1">
                {['3m', '6m', '1y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => handleDateRangeChange(range)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                      dateRange === range
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {range === '3m' ? '3M' : range === '6m' ? '6M' : '1Y'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature D: Live Landed Cost Calculator Card */}
        <div className="card p-6 mb-6 border-2 border-teal-100 bg-gradient-to-br from-white to-teal-50/20">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Itemised Landed Cost Calculator </h3>
                <p className="text-xs text-slate-400">Itemised costs for Base Freight, BAF, Port Charges, and Demurrage in USD & INR</p>
              </div>
            </div>
            <button
              onClick={handleCalculateCost}
              disabled={calcLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              {calcLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Landed Cost'
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Input Controls */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Cargo Volume (MT): <span className="font-mono text-teal-700 font-bold">{volumeMt.toLocaleString()} MT</span>
                </label>
                <input
                  type="range"
                  min="10000"
                  max="250000"
                  step="5000"
                  value={volumeMt}
                  onChange={(e) => setVolumeMt(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>10,000 MT</span>
                  <span>250,000 MT</span>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {costResult ? (
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Base Freight</p>
                  <p className="text-base font-bold text-slate-900 font-mono mt-1">
                    ${(parseFloat(costResult.base_freight_cost) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-[11px] text-slate-400">Freight component</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">BAF (Fuel)</p>
                  <p className="text-base font-bold text-amber-600 font-mono mt-1">
                    ${(parseFloat(costResult.bunker_adjustment_factor) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-[11px] text-slate-400">8% adjustment</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Port & Demurrage</p>
                  <p className="text-base font-bold text-slate-700 font-mono mt-1">
                    ${((parseFloat(costResult.port_handling_charges) + parseFloat(costResult.demurrage_buffer)) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-[11px] text-slate-400">Handling & buffer</p>
                </div>

                <div className="bg-teal-600 text-white p-3 rounded-xl shadow-md">
                  <p className="text-[10px] font-semibold text-teal-100 uppercase tracking-wider">Total Landed Cost</p>
                  <p className="text-lg font-extrabold font-mono mt-0.5">
                    ${(parseFloat(costResult.total_landed_cost_usd) / 1e6).toFixed(2)}M
                  </p>
                  <p className="text-[11px] font-bold text-teal-200 font-mono mt-0.5">
                    ₹{(parseFloat(costResult.total_landed_cost_inr) / 1e7).toFixed(2)} Cr
                  </p>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white/70 p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-sm">
                Click <span className="font-semibold text-teal-700">"Calculate Landed Cost"</span> to trigger real backend API landed cost calculation.
              </div>
            )}
          </div>
        </div>

        {/* Rate Breakdown Table */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Table className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Base Freight vs BAF Historical Data
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Total Rate ($/MT)</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Base Freight ($/MT)</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">BAF ($/MT)</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">BAF %</th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-50 pointer-events-none' : ''}>
                {breakdownData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-semibold font-mono">${row.rate.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-teal-600 font-mono">${row.base_freight.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-600 font-mono">${row.baf.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                      {((row.baf / row.rate) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            BAF (Bunker Adjustment Factor) represents the fuel component of the freight rate, typically 25-30% of total cost.
          </p>
        </div>
      </main>
    </div>
  );
}
