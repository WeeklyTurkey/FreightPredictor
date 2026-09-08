import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Anchor, Search, AlertTriangle, Ship, Clock, ChevronDown,
  ArrowUpDown, Bell, Container,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FeasibilityChecker from '../components/FeasibilityChecker';
import { getPortStatus, getVesselSchedule } from '../api/freightService';
import { MOCK_PORT_ALERTS } from '../api/mockData';

// Shared congestion colors.
export const getStatusColor = (status) => {
  if (status === 'Congested') return 'text-rose-600 bg-rose-50 border-rose-200';
  if (status === 'Moderate') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
};

const STATUS_META = {
  Congested: { badge: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
  Moderate: { badge: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  Clear: { badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
};

const VESSEL_STATUS = {
  arriving: { label: 'Arriving', badge: 'text-sky-700 bg-sky-50 border-sky-200' },
  in_port: { label: 'In port', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  waiting: { label: 'Waiting', badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  departing: { label: 'Departing', badge: 'text-slate-600 bg-slate-100 border-slate-200' },
};

const SEVERITY_META = {
  high: 'border-rose-200 bg-rose-50 text-rose-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

// Extract a sortable timestamp from arrival strings like
// "2026-09-06 06:30", "ETA 2026-09-10 04:00", or "TBC" (sorts last).
const arrivalKey = (s) => {
  const m = String(s || '').match(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/);
  if (!m) return Number.POSITIVE_INFINITY;
  return new Date(`${m[1]}T${m[2] || '00:00'}:00`).getTime();
};

const SORTS = {
  name: { label: 'Vessel', key: (v) => (v.name || '').toLowerCase() },
  volume: { label: 'Cargo volume', key: (v) => Number(v.volumeMt) || 0 },
  arrival: { label: 'Arrival', key: (v) => arrivalKey(v.arrival) },
  delay: { label: 'Delay', key: (v) => Number(v.delayHrs) || 0 },
};

function KpiTile({ label, value, sub, tone = 'text-slate-900' }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function VesselDetail({ vessel }) {
  const rows = [
    ['IMO', vessel.imo],
    ['Vessel class', vessel.vesselClass],
    ['Vessel type', vessel.vesselType],
    ['Cargo', vessel.cargo],
    ['Cargo volume', `${Number(vessel.volumeMt || 0).toLocaleString()} MT`],
    ['Arrival', vessel.arrival],
    ['Est. departure', vessel.departure],
    ['Berth / anchorage', vessel.berth],
    ['Draft', `${vessel.draft} m`],
    ['LOA', `${vessel.loa} m`],
    ['Beam', `${vessel.beam} m`],
    ['Charterer / operator', vessel.charterer],
    ['Delay / waiting time', vessel.delayHrs > 0 ? `${vessel.delayHrs} h` : 'On schedule'],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 px-4 py-4 bg-slate-50/70 border-t border-slate-100 text-xs">
      {rows.map(([label, value]) => (
        <div key={label}>
          <p className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">{label}</p>
          <p className="text-slate-800 font-medium mt-0.5">{value ?? '—'}</p>
        </div>
      ))}
    </div>
  );
}

export default function PortStatus() {
  const [ports, setPorts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [schedule, setSchedule] = useState({ vessels: [], simulated: true, source: '', updated: '' });
  const [schedLoading, setSchedLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [vesselSearch, setVesselSearch] = useState('');
  const [sortKey, setSortKey] = useState('arrival');
  const [sortDir, setSortDir] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getPortStatus()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setPorts(list);
        setSelectedId((prev) => prev ?? list[0]?.id ?? list[0]?.port ?? null);
        setLoading(false);
      })
      .catch((err) => {
        setPorts([]);
        setLoadError(err?.message || 'Failed to load port data.');
        setLoading(false);
      });
  }, []);

  const selectedPort =
    ports.find((p) => (p.id ?? p.port) === selectedId) || ports[0] || null;

  useEffect(() => {
    if (!selectedPort) return;
    setSchedLoading(true);
    setExpandedId(null);
    getVesselSchedule(selectedPort.port)
      .then((s) => {
        setSchedule({
          vessels: Array.isArray(s.vessels) ? s.vessels : [],
          simulated: s.simulated !== false,
          source: s.source || '',
          updated: s.updated || '',
        });
        setSchedLoading(false);
      })
      .catch(() => {
        setSchedule({ vessels: [], simulated: true, source: '', updated: '' });
        setSchedLoading(false);
      });
  }, [selectedPort?.port]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c = { all: schedule.vessels.length, arriving: 0, in_port: 0, waiting: 0, departing: 0 };
    schedule.vessels.forEach((v) => { if (c[v.status] !== undefined) c[v.status] += 1; });
    return c;
  }, [schedule.vessels]);

  const visibleVessels = useMemo(() => {
    const q = vesselSearch.trim().toLowerCase();
    const filtered = schedule.vessels.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (!q) return true;
      return `${v.name || ''} ${v.imo || ''} ${v.cargo || ''} ${v.charterer || ''} ${v.vesselClass || ''}`
        .toLowerCase().includes(q);
    });
    const getKey = SORTS[sortKey].key;
    return [...filtered].sort((a, b) => {
      const ka = getKey(a); const kb = getKey(b);
      if (ka < kb) return -1 * sortDir;
      if (ka > kb) return 1 * sortDir;
      return 0;
    });
  }, [schedule.vessels, statusFilter, vesselSearch, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (key === sortKey) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(1); }
  };

  const alerts = (selectedPort && MOCK_PORT_ALERTS[selectedPort.port]) || [];
  const statusMeta = STATUS_META[selectedPort?.status] || STATUS_META.Clear;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
            Loading port operations...
          </div>
        </div>
      </div>
    );
  }

  if (loadError || ports.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
          <div className="card p-10 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <p className="font-medium text-slate-800 mb-1">Could not load port indicators</p>
            <p className="text-sm text-slate-400 mb-4">
              {loadError || 'The port-traffic feed returned no ports. Start the backend and retry.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 font-medium text-sm shadow-sm transition-all"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Port Status</h2>
            <p className="text-sm text-slate-400 mt-1">
              Operational overview for procurement and logistics — congestion, vessel activity, and physical feasibility
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-slate-200 bg-white text-slate-500">
              East Coast India · {ports.length} ports tracked
            </span>
          </div>
        </div>

        {/* Port navigation */}
        <div className="card p-3 mb-5">
          <div className="flex items-center gap-2 px-2 pt-1 pb-2">
            <Anchor className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">East Coast India ports</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Select port">
            {ports.map((p) => {
              const id = p.id ?? p.port;
              const active = (p.id ?? p.port) === (selectedPort.id ?? selectedPort.port);
              const meta = STATUS_META[p.status] || STATUS_META.Clear;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-teal-500 ${
                    active
                      ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                  {p.port}
                  <span className="text-xs text-slate-400 font-mono">{p.ships_in_port ?? 0} in port</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI strip for the selected port */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
          <div className="card p-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Congestion</p>
            <p className="mt-2">
              <span className={`badge px-2.5 py-1 border text-sm font-bold ${statusMeta.badge}`}>
                {selectedPort.status || 'Clear'}
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-2">{selectedPort.country || 'India'}</p>
          </div>
          <KpiTile label="Avg waiting time" value={`${selectedPort.avg_wait_days ?? '—'}`} sub="days" />
          <KpiTile label="Vessels in port" value={selectedPort.ships_in_port ?? '—'} sub="berthed / working" />
          <KpiTile
            label="Vessels waiting"
            value={selectedPort.vessels_waiting ?? '—'}
            sub="at anchorage"
            tone={Number(selectedPort.vessels_waiting) > 8 ? 'text-rose-600' : 'text-slate-900'}
          />
          <KpiTile label="Expected incoming" value={selectedPort.expected_incoming ?? '—'} sub="chartered parcels" />
          <KpiTile
            label="Berth utilization"
            value={`${selectedPort.berth_utilization ?? '—'}${selectedPort.berth_utilization != null ? '%' : ''}`}
            sub={Number(selectedPort.berth_utilization) > 85 ? 'Near capacity' : 'Available windows open'}
            tone={Number(selectedPort.berth_utilization) > 85 ? 'text-rose-600' : 'text-slate-900'}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          {/* Vessel activity */}
          <section className="card xl:col-span-2 overflow-hidden" aria-label="Vessel activity">
            <div className="p-5 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-semibold text-slate-800">
                    Vessel activity — {selectedPort.port}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {visibleVessels.length} of {schedule.vessels.length} vessels shown
                  </span>
                </div>
              </div>

              {/* Status filter + search */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by vessel status">
                  {[['all', 'All'], ...Object.entries(VESSEL_STATUS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      aria-pressed={statusFilter === key}
                      className={`px-3 py-1.5 text-xs font-semibold border transition-all focus-visible:outline-2 focus-visible:outline-teal-500 ${
                        statusFilter === key
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300'
                      }`}
                    >
                      {label} <span className="font-mono opacity-80">({counts[key] ?? 0})</span>
                    </button>
                  ))}
                </div>
                <div className="relative lg:ml-auto lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search vessel, IMO, cargo, charterer..."
                    value={vesselSearch}
                    onChange={(e) => setVesselSearch(e.target.value)}
                    aria-label="Search vessels"
                    className="w-full input-field text-sm pl-10"
                  />
                </div>
              </div>
            </div>

            {schedLoading ? (
              <div className="flex items-center justify-center py-14 text-slate-400 text-sm gap-3">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                Loading vessel schedule...
              </div>
            ) : visibleVessels.length === 0 ? (
              <div className="py-14 text-center">
                <Container className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-700">No vessels match this view</p>
                <p className="text-sm text-slate-400 mt-1">
                  {schedule.vessels.length === 0
                    ? `No schedule entries exist for ${selectedPort.port}.`
                    : 'Try clearing the search or choosing a different status filter.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      {['name', 'volume', 'arrival', 'delay'].map((key) => (
                        <th key={key} className="px-4 py-2.5 font-semibold" aria-sort={sortKey === key ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'}>
                          <button
                            onClick={() => toggleSort(key)}
                            className="inline-flex items-center gap-1 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-500"
                          >
                            {SORTS[key].label}
                            <ArrowUpDown className={`w-3 h-3 ${sortKey === key ? 'text-teal-600' : 'opacity-40'}`} />
                          </button>
                        </th>
                      ))}
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Berth</th>
                      <th className="px-4 py-2.5 w-10"><span className="sr-only">Expand</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleVessels.map((v) => {
                      const meta = VESSEL_STATUS[v.status] || VESSEL_STATUS.waiting;
                      const expanded = expandedId === v.id;
                      return (
                        <Fragment key={v.id}>
                          <tr className="border-b border-slate-50 hover:bg-teal-50/30">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800">{v.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{v.imo} · {v.vesselClass}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-mono text-slate-700">{Number(v.volumeMt || 0).toLocaleString()} MT</p>
                              <p className="text-xs text-slate-400">{v.cargo}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{v.arrival}</td>
                            <td className="px-4 py-3">
                              {v.delayHrs > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                                  <Clock className="w-3.5 h-3.5" /> {v.delayHrs}h
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600 font-medium">On schedule</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge px-2 py-0.5 border text-xs font-semibold whitespace-nowrap ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate" title={v.berth}>{v.berth}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setExpandedId(expanded ? null : v.id)}
                                aria-expanded={expanded}
                                aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${v.name}`}
                                className="p-1.5 border border-slate-200 text-slate-500 hover:border-teal-400 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-500"
                              >
                                <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                              </button>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="border-b border-slate-100">
                              <td colSpan={7} className="p-0">
                                <VesselDetail vessel={v} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Operational alerts */}
          <aside className="card p-5 h-fit" aria-label="Operational alerts">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-semibold text-slate-800">Operational alerts</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {selectedPort.port} · {alerts.length} active
            </p>
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400 border border-dashed border-slate-200">
                No active alerts for this port.
              </div>
            ) : (
              <ul className="space-y-3">
                {alerts.map((a, i) => (
                  <li key={i} className={`border p-3 text-xs leading-relaxed ${SEVERITY_META[a.severity] || SEVERITY_META.low}`}>
                    <span className="block font-bold uppercase tracking-wide text-[10px] mb-1 opacity-80">
                      {a.severity} priority
                    </span>
                    {a.text}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
              <p><span className="text-slate-400">Terminal efficiency:</span> <strong className="text-slate-700">{selectedPort.berth_utilization ?? '—'}% berth utilization</strong></p>
              <p><span className="text-slate-400">Queue pressure:</span> <strong className="text-slate-700">{selectedPort.vessels_waiting ?? 0} waiting · {selectedPort.avg_wait_days ?? '—'}d avg wait</strong></p>
              <p><span className="text-slate-400">Pipeline:</span> <strong className="text-slate-700">{selectedPort.expected_incoming ?? 0} parcels inbound</strong></p>
            </div>
          </aside>
        </div>

        {/* Shared physical constraint verification engine (single instance) */}
        <section aria-label="Physical constraint verification" className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-semibold text-slate-800">Physical constraint verification</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 border border-teal-200 bg-teal-50 text-teal-700">
              Shared tool — applies to any port above
            </span>
          </div>
          <FeasibilityChecker
            key={selectedPort.port}
            ports={ports}
            initialPortName={selectedPort.port}
          />
        </section>

      </main>
    </div>
  );
}
