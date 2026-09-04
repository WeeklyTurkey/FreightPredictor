import { useEffect, useState } from 'react';
import { Gauge } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getMarketKPIs, getVoyages } from '../api/freightService';

export default function FleetReadiness() {
  const [kpis, setKpis] = useState(null);
  const [voyages, setVoyages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMarketKPIs(), getVoyages()]).then(([kpisData, voyagesData]) => {
      setKpis(kpisData);
      setVoyages(voyagesData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading fleet data...
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Readiness</h2>
          <p className="text-sm text-slate-400 mt-1">Global vessel availability and deployment metrics</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-8">
            <Gauge className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-semibold text-slate-700">Fleet Overview</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90">
                  <circle cx="64" cy="64" r="54" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                  <circle
                    cx="64" cy="64" r="54"
                    stroke="#0d9488"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 54 * (kpis.fleet_readiness.readiness_pct / 100)} ${2 * Math.PI * 54}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute">
                  <p className="text-3xl font-bold text-slate-900 font-mono">{kpis.fleet_readiness.readiness_pct}%</p>
                  <p className="text-xs text-slate-400 font-medium">Ready</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center bg-slate-50 p-6 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Available Vessels</p>
              <p className="text-4xl font-bold text-slate-900 font-mono">{kpis.fleet_readiness.available_vessels}</p>
              <p className="text-sm text-slate-500 mt-2">of <span className="font-semibold">{kpis.fleet_readiness.total_fleet}</span> total fleet</p>
            </div>
            
            <div className="flex flex-col justify-center bg-teal-50/50 p-6 rounded-xl border border-teal-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">In Transit</p>
              <p className="text-4xl font-bold text-teal-600 font-mono">{voyages.filter((v) => v.status === 'In Transit').length}</p>
              <p className="text-sm text-slate-500 mt-2">vessels underway</p>
            </div>
            
            <div className="flex flex-col justify-center bg-amber-50/50 p-6 rounded-xl border border-amber-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Loading</p>
              <p className="text-4xl font-bold text-amber-600 font-mono">{voyages.filter((v) => v.status === 'Loading').length}</p>
              <p className="text-sm text-slate-500 mt-2">vessels at port</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
