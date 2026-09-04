import { useEffect, useState } from 'react';
import { Anchor, ShieldCheck, AlertTriangle, Ship, CheckCircle2, XCircle, Sliders } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getPortStatus, checkPortFeasibility } from '../api/freightService';

export default function PortStatus() {
  const [portStatus, setPortStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feature C: Feasibility state
  const [selectedPortId, setSelectedPortId] = useState('Visakhapatnam');
  const [selectedVesselId, setSelectedVesselId] = useState('Capesize');
  const [volumeMt, setVolumeMt] = useState(120000);
  const [feasibilityResult, setFeasibilityResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getPortStatus().then((data) => {
      setPortStatus(data);
      setLoading(false);
    });
  }, []);

  const handleCheckFeasibility = async () => {
    setChecking(true);
    try {
      const res = await checkPortFeasibility(selectedPortId, selectedVesselId, volumeMt);
      setFeasibilityResult(res);
    } catch (err) {
      console.error('Feasibility check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Congested') return 'text-rose-600 bg-rose-50 border-rose-200';
    if (status === 'Moderate') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading port data...
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Port Status & Physical Constraint Verification</h2>
          <p className="text-sm text-slate-400 mt-1">Real-time port congestion and automated vessel draft/beam/LOA feasibility checks</p>
        </div>

        {/* Feature C: Automated Port & Vessel Feasibility Verification Widget */}
        <div className="card p-6 mb-6 border-2 border-teal-100 bg-gradient-to-br from-white to-teal-50/20">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Physical Constraint Verification Engine </h3>
                <p className="text-xs text-slate-400">Verify draft, beam, LOA and DWT volume compatibility against East Coast Indian ports</p>
              </div>
            </div>
            <button
              onClick={handleCheckFeasibility}
              disabled={checking}
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Check Feasibility'
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Input Controls */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Destination Port
                </label>
                <select
                  value={selectedPortId}
                  onChange={(e) => setSelectedPortId(e.target.value)}
                  className="w-full input-field text-sm"
                >
                  <option value="Visakhapatnam">Visakhapatnam (Max Draft: 16.5m)</option>
                  <option value="Paradip">Paradip (Max Draft: 14.5m)</option>
                  <option value="Chennai">Chennai (Max Draft: 12.0m)</option>
                  <option value="Haldia">Haldia (Max Draft: 7.5m - Draft Restricted)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Vessel Class
                </label>
                <select
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                  className="w-full input-field text-sm"
                >
                  <option value="Capesize">Capesize (Req. Draft: 18.2m, LOA: 290m)</option>
                  <option value="Panamax">Panamax (Req. Draft: 14.5m, LOA: 225m)</option>
                  <option value="Supramax">Supramax (Req. Draft: 12.2m, LOA: 190m)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Cargo Volume: <span className="font-mono text-teal-700 font-bold">{volumeMt.toLocaleString()} MT</span>
                </label>
                <input
                  type="range"
                  min="20000"
                  max="180000"
                  step="5000"
                  value={volumeMt}
                  onChange={(e) => setVolumeMt(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Feasibility Result Display */}
            {feasibilityResult ? (
              <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {feasibilityResult.is_compatible ? (
                      <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-sm py-1 px-3 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Compatible / Feasible
                      </span>
                    ) : (
                      <span className="badge bg-rose-100 text-rose-800 border border-rose-300 text-sm py-1 px-3 flex items-center gap-1 font-bold">
                        <XCircle className="w-4 h-4 text-rose-600" /> Incompatible / Physical Limit Violation
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Recommended Vessel: <strong className="text-teal-700 font-bold">{feasibilityResult.recommended_vessel}</strong>
                  </span>
                </div>

                {feasibilityResult.warnings && feasibilityResult.warnings.length > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Physical Constraints Warning:
                    </p>
                    {feasibilityResult.warnings.map((warn, i) => (
                      <p key={i} className="text-xs text-amber-700 leading-relaxed">• {warn}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                    ✓ Vessel specifications (Draft, Beam, LOA, DWT) strictly comply with target port physical limits.
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Port Draft Limit</span>
                    <strong className="text-slate-800 font-mono">{feasibilityResult.details?.port_max_draft}m</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Vessel Req. Draft</span>
                    <strong className={`font-mono ${feasibilityResult.details?.vessel_draft > feasibilityResult.details?.port_max_draft ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                      {feasibilityResult.details?.vessel_draft}m
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Vessel Max DWT</span>
                    <strong className="text-slate-800 font-mono">{(feasibilityResult.details?.vessel_max_dwt / 1000).toFixed(0)}k DWT</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white/70 p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-sm">
                Click <span className="font-semibold text-teal-700">"Check Feasibility"</span> to verify physical draft, beam, and LOA compatibility via real Django API logic.
              </div>
            )}
          </div>
        </div>

        {/* Existing Port Status Cards */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-6">
            <Anchor className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-semibold text-slate-700">East Coast India Ports Traffic</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {portStatus.map((port) => (
              <div key={port.port} className="bg-slate-50 rounded-lg p-5 border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-slate-400" />
                    <span className="text-lg font-bold text-slate-800">{port.port}</span>
                  </div>
                  <span className={`badge ${getStatusColor(port.status)} px-3 py-1 border`}>
                    {port.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-white p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Vessels Waiting</p>
                    <p className="text-xl font-bold text-slate-700 font-mono">{port.vessels_waiting}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Avg Wait Time</p>
                    <p className="text-xl font-bold text-slate-700 font-mono">{port.avg_wait_days} <span className="text-sm font-medium">days</span></p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-slate-600">Berth Utilization</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{port.berth_utilization}%</p>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        port.berth_utilization > 85 ? 'bg-rose-500' : port.berth_utilization > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${port.berth_utilization}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
