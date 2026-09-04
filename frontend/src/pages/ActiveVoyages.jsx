import { useEffect, useState } from 'react';
import { Ship } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getVoyages } from '../api/freightService';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export default function ActiveVoyages() {
  const [voyages, setVoyages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVoyages().then((data) => {
      setVoyages(data);
      setLoading(false);
    });
  }, []);

  const getVoyageStatusColor = (status) => {
    if (status === 'In Transit') return 'text-teal-700 bg-teal-50';
    if (status === 'Loading') return 'text-amber-700 bg-amber-50';
    return 'text-slate-500 bg-slate-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading voyages...
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Voyages</h2>
          <p className="text-sm text-slate-400 mt-1">Real-time tracking of inbound chartered vessels</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-semibold text-slate-700">Inbound Fleet</h3>
            </div>
            <span className="badge bg-teal-50 text-teal-700 border border-teal-200">
              {voyages.length} Active
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voyages.map((voyage) => (
              <div key={voyage.id} className="bg-slate-50 rounded-lg p-4 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">{voyage.vessel_name}</span>
                  </div>
                  <span className={`badge ${getVoyageStatusColor(voyage.status)} text-xs border`}>{voyage.status}</span>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Charterer</p>
                  <p className="text-sm font-medium text-slate-700">{voyage.charterer}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <p className="text-xs text-slate-400 mb-0.5">Route</p>
                    <p className="font-medium text-slate-700">{voyage.route_name}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <p className="text-xs text-slate-400 mb-0.5">Cargo</p>
                    <p className="font-medium text-slate-700">{voyage.cargo_type}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <p className="text-xs text-slate-400 mb-0.5">Volume</p>
                    <p className="font-medium text-slate-700 font-mono">{(voyage.cargo_volume_mt / 1000).toFixed(0)}K MT</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <p className="text-xs text-slate-400 mb-0.5">Rate</p>
                    <p className="font-medium text-slate-700 font-mono">${voyage.freight_rate}/MT</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${voyage.progress_pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-700 font-bold tabular-nums font-mono">{voyage.progress_pct}%</span>
                </div>
                <p className="text-xs text-right text-slate-400 mt-1">ETA {formatDate(voyage.eta)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
