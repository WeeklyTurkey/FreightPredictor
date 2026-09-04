import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  TrendingUp,
  Calculator,
  Sliders,
  CheckCircle,
  Info,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { getRoutes, runSimulation } from '../api/freightService';

export default function ScenarioSimulator() {
  const [searchParams] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [simVolume, setSimVolume] = useState(150000);
  const [simLaycan, setSimLaycan] = useState(3);
  const [simRoute, setSimRoute] = useState('');
  const [simCharterType, setSimCharterType] = useState('spot');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    getRoutes().then((routesData) => {
      setRoutes(routesData);
      const routeParam = searchParams.get('route');
      setSimRoute(routeParam || routesData[0]?.id || '');
      setLoading(false);
    });
  }, []);

  const runSim = useCallback(async () => {
    if (!simRoute) return;
    setSimLoading(true);
    const result = await runSimulation(simVolume, simLaycan, simRoute, simCharterType);
    setSimResult(result);
    setSimLoading(false);
  }, [simVolume, simLaycan, simRoute, simCharterType]);

  useEffect(() => {
    if (simRoute) runSim();
  }, [simRoute, runSim]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading simulator...
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Scenario Simulator</h2>
          <p className="text-sm text-slate-400 mt-1">Interactive tool to compare Spot vs. Time Charter costs based on ML projections</p>
        </div>

        {/* Scenario Simulator */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-semibold text-slate-700">Cost Comparison Simulator</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-400" /> Cargo Volume
                  </label>
                  <span className="text-lg font-bold text-teal-600 tabular-nums font-mono">
                    {(simVolume / 1000).toFixed(0)}K MT
                  </span>
                </div>
                <input type="range" min="10000" max="200000" step="5000" value={simVolume}
                  onChange={(e) => setSimVolume(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none" />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>10K MT</span><span>200K MT</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Laycan Window
                  </label>
                  <span className="text-lg font-bold text-teal-600 tabular-nums font-mono">{simLaycan} weeks</span>
                </div>
                <input type="range" min="1" max="8" step="1" value={simLaycan}
                  onChange={(e) => setSimLaycan(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none" />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>1 week</span><span>8 weeks</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">Route Configuration</label>
                <select value={simRoute} onChange={(e) => setSimRoute(e.target.value)} className="w-full input-field p-3">
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.origin_port} → {route.destination_port}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">Current Strategy</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSimCharterType('spot')}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all shadow-sm ${
                      simCharterType === 'spot' 
                        ? 'bg-teal-600 text-white shadow-teal-600/20' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >Spot / Voyage</button>
                  <button
                    onClick={() => setSimCharterType('time_charter')}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all shadow-sm ${
                      simCharterType === 'time_charter' 
                        ? 'bg-teal-600 text-white shadow-teal-600/20' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >Time Charter</button>
                </div>
              </div> */}
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
              {simLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-medium">Running scenario calculations...</p>
                </div>
              ) : simResult ? (
                <div className="space-y-6">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Analysis Results</h4>

                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    simResult.recommended === 'spot' ? 'border-emerald-300 bg-emerald-50/50' : 'border-white bg-white shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-semibold text-slate-700">Spot / Voyage Charter</span>
                      {simResult.recommended === 'spot' && (
                        <span className="badge bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-medium">
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-slate-900 font-mono mb-1">${(simResult.spot.total_cost / 1e6).toFixed(2)}M</p>
                    <p className="text-sm text-slate-500 font-medium">${simResult.spot.cost_per_mt}/MT @ ${simResult.spot.rate}/MT</p>
                  </div>

                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    simResult.recommended === 'time_charter' ? 'border-emerald-300 bg-emerald-50/50' : 'border-white bg-white shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-semibold text-slate-700">Time Charter</span>
                      {simResult.recommended === 'time_charter' && (
                        <span className="badge bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-medium">
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-slate-900 font-mono mb-2">${(simResult.time_charter.total_cost / 1e6).toFixed(2)}M</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                      <p>Hire: ${(simResult.time_charter.hire_cost / 1000).toFixed(0)}K</p>
                      <p>Bunker: ${(simResult.time_charter.bunker_cost / 1000).toFixed(0)}K</p>
                      <p>Port: ${(simResult.time_charter.port_charges / 1000).toFixed(0)}K</p>
                      <p className="font-semibold text-slate-700">${simResult.time_charter.cost_per_mt}/MT</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl border border-teal-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-base font-semibold text-slate-800">Potential Savings</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600 font-mono">${(simResult.savings / 1000).toFixed(0)}K</p>
                      <p className="text-sm font-medium text-slate-500">{simResult.savings_pct}% vs alternative</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                      <Info className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-600">
                      Based on AI projection of <span className="font-bold text-slate-800 font-mono">${simResult.projected_rate_30d.toFixed(2)}/MT</span> in 30 days.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-base">
                  Adjust sliders to generate a scenario comparison
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
