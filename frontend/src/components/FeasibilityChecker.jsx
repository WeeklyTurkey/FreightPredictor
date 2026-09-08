import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, WifiOff } from 'lucide-react';
import { checkPortFeasibility, getVesselClasses } from '../api/freightService';

const FALLBACK_VESSEL_OPTIONS = ['Capesize', 'Panamax', 'Supramax'];

// Physical constraint verification engine UI — the SINGLE shared instance
// lives on the main Port Status page. Port options come from props; vessel
// class options load from the live registry (GET /vessels/) so the dropdown
// can only offer classes the backend can resolve. The compatibility verdict
// itself always comes from POST /api/v1/port-feasibility/ — never fabricated.
export default function FeasibilityChecker({ ports = [], initialPortName = '' }) {
  const portNames = ports.map((p) => p.port || p.name).filter(Boolean);
  const [selectedPortName, setSelectedPortName] = useState(
    initialPortName || portNames[0] || ''
  );
  const [vesselOptions, setVesselOptions] = useState(FALLBACK_VESSEL_OPTIONS);
  const [selectedVessel, setSelectedVessel] = useState(FALLBACK_VESSEL_OPTIONS[0]);
  const [volumeMt, setVolumeMt] = useState(120000);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getVesselClasses()
      .then((list) => {
        if (cancelled) return;
        const names = (Array.isArray(list) ? list : [])
          .map((v) => (typeof v === 'string' ? v : v?.name))
          .filter(Boolean);
        if (names.length > 0) {
          setVesselOptions(names);
          setSelectedVessel((prev) => (names.includes(prev) ? prev : names[0]));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await checkPortFeasibility(selectedPortName, selectedVessel, volumeMt);
      setResult(res);
    } catch (err) {
      setError(err?.message || 'Feasibility check failed.');
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  const showConnectivityHint = /backend|registry|unreachable|failed to fetch|network/i.test(error);
  const details = result?.details || {};
  const overCapacity =
    result && Number(details.cargo_volume_mt) > Number(details.vessel_max_dwt);

  return (
    <div className="card p-6 border-2 border-teal-100 bg-gradient-to-br from-white to-teal-50/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-100 text-teal-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Physical Constraint Verification Engine</h3>
            <p className="text-xs text-slate-400">Verify draft, beam, LOA and DWT volume compatibility</p>
          </div>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking || !selectedPortName}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 font-semibold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {checking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            'Check Feasibility'
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
              Destination Port
            </label>
            <select
              value={selectedPortName}
              onChange={(e) => setSelectedPortName(e.target.value)}
              className="w-full input-field text-sm"
            >
              {portNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
              Vessel Class
            </label>
            <select
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
              className="w-full input-field text-sm"
            >
              {vesselOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
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
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 appearance-none"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700" role="alert">
              <p className="font-semibold flex items-center gap-1.5">
                {showConnectivityHint && <WifiOff className="w-3.5 h-3.5" />}
                Feasibility check could not be completed
              </p>
              <p className="mt-1 leading-relaxed">{error}</p>
            </div>
          )}
          {!error && result && (
            <div className="bg-white p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {result.is_compatible ? (
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
                  Recommended Vessel: <strong className="text-teal-700 font-bold">{result.recommended_vessel}</strong>
                </span>
              </div>

              {result.warnings && result.warnings.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 p-3 space-y-1">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Physical Constraints Warning:
                  </p>
                  {result.warnings.map((warn, i) => (
                    <p key={i} className="text-xs text-amber-700 leading-relaxed">• {warn}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5">
                  ✓ Vessel specifications (Draft, Beam, LOA, DWT) strictly comply with target port physical limits.
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Draft', port: details.port_max_draft, vessel: details.vessel_draft, unit: 'm' },
                  { label: 'Beam', port: details.port_max_beam, vessel: details.vessel_beam, unit: 'm' },
                  { label: 'LOA', port: details.port_max_loa, vessel: details.vessel_loa, unit: 'm' },
                ].map((row) => {
                  const violates = Number(row.vessel) > Number(row.port);
                  return (
                    <div key={row.label} className={`p-2.5 border ${violates ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wide text-[10px]">{row.label}</span>
                      <span className="block mt-0.5">Port max: <strong className="font-mono text-slate-800">{row.port ?? '—'}{row.port != null ? row.unit : ''}</strong></span>
                      <span className="block">Vessel: <strong className={`font-mono ${violates ? 'text-rose-600' : 'text-slate-800'}`}>{row.vessel ?? '—'}{row.vessel != null ? row.unit : ''}</strong></span>
                    </div>
                  );
                })}
                <div className={`p-2.5 border ${overCapacity ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wide text-[10px]">Capacity</span>
                  <span className="block mt-0.5">Cargo: <strong className="font-mono text-slate-800">{Number(details.cargo_volume_mt || 0).toLocaleString()} MT</strong></span>
                  <span className="block">Vessel max: <strong className={`font-mono ${overCapacity ? 'text-rose-600' : 'text-slate-800'}`}>{details.vessel_max_dwt ? `${(details.vessel_max_dwt / 1000).toFixed(0)}k DWT` : '—'}</strong></span>
                </div>
              </div>
              {overCapacity && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 leading-relaxed">
                  Cargo exceeds this vessel&apos;s capacity. Short-load to{' '}
                  <strong>{Number(details.vessel_max_dwt).toLocaleString()} MT</strong> or upsize to a{' '}
                  <strong>{result.recommended_vessel}</strong> before fixing the charter.
                </p>
              )}
            </div>
          )}
          {!error && !result && (
            <div className="bg-white/70 p-6 border border-dashed border-slate-300 text-center text-slate-400 text-sm">
              Click <span className="font-semibold text-teal-700">"Check Feasibility"</span> to verify physical draft, beam, and LOA compatibility via the port-feasibility API.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
