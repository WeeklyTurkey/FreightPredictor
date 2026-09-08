import React, { useEffect, useState } from 'react';
import {
 Users,
 Search,
 Clock,
 AlertTriangle,
 TrendingUp,
 CreditCard,
 FileText,
 ChevronDown,
 ChevronUp,
 Building2,
 Award,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TrustBadge from '../components/TrustBadge';
import { getCharterers } from '../api/freightService';

export default function Charterers() {
 const [charterers, setCharterers] = useState([]);
 const [filtered, setFiltered] = useState([]);
 const [search, setSearch] = useState('');
 const [sortBy, setSortBy] = useState('trust_score');
 const [sortDir, setSortDir] = useState('desc');
 const [expandedId, setExpandedId] = useState(null);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState('');
 const [riskFilter, setRiskFilter] = useState('all');
 const [updatedAt, setUpdatedAt] = useState(null);

 const fetchCharterers = () => {
 setLoading(true);
 setLoadError('');
 getCharterers()
 .then((data) => {
 setCharterers(Array.isArray(data) ? data : []);
 setUpdatedAt(new Date());
 setLoading(false);
 })
 .catch((err) => {
 setCharterers([]);
 setLoadError(err?.message || 'Failed to load the charterer directory.');
 setLoading(false);
 });
 };

 useEffect(() => {
 fetchCharterers();
 }, []);

 useEffect(() => {
 let result = charterers.filter((c) =>
 c.name.toLowerCase().includes(search.toLowerCase()) ||
 c.type.toLowerCase().includes(search.toLowerCase()) ||
 c.country.toLowerCase().includes(search.toLowerCase())
 );
 if (riskFilter !== 'all') {
 result = result.filter((c) => c.default_risk === riskFilter);
 }

 result.sort((a, b) => {
 const aVal = a[sortBy];
 const bVal = b[sortBy];
 if (typeof aVal === 'string') {
 return sortDir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
 }
 return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
 });
 setFiltered(result);
 }, [search, charterers, sortBy, sortDir, riskFilter]);

 // Procurement metrics computed from actual response fields. Averages skip
 // records missing the input; counts and totals treat missing as zero.
 const numValues = charterers
 .map((c) => c.on_time_delivery_pct ?? c.on_time_delivery_rate ?? null)
 .filter((v) => v != null);
 const payValues = charterers
 .map((c) => c.payment_reliability_pct ?? null)
 .filter((v) => v != null);
 const avg = (vals) => vals.length > 0
 ? (vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(1)
 : '—';
 const totalVoyages = charterers.reduce((s, c) => s + (Number(c.total_voyages) || 0), 0);

 // Score-factor breakdown mirroring backend/app/trust_score.py weights.
 // Component scores come from the record's own raw inputs; the official
 // trust score from the backend remains authoritative.
 const scoreFactors = (c) => {
 const inputs = {
 onTime: c.on_time_delivery_pct ?? c.on_time_delivery_rate ?? null,
 payment: c.payment_reliability_pct ?? null,
 damage: c.cargo_damage_incidents ?? null,
 years: c.years_in_operation ?? null,
 voyages: c.total_voyages ?? null,
 };
 if (Object.values(inputs).some((v) => v == null)) return null;
 const damageMap = { 0: 100, 1: 90, 2: 75, 3: 60, 4: 40 };
 const damageScore = damageMap[inputs.damage] ?? Math.max(20, 100 - inputs.damage * 15);
 return [
 { label: 'On-time delivery', weight: 0.35, score: Math.round(inputs.onTime * 10) / 10 },
 { label: 'Payment reliability', weight: 0.25, score: Math.round(inputs.payment * 10) / 10 },
 { label: 'Cargo handling', weight: 0.20, score: damageScore },
 { label: 'Experience', weight: 0.10, score: Math.round(Math.min((inputs.years / 20) * 100, 100) * 10) / 10 },
 { label: 'Volume', weight: 0.10, score: Math.round(Math.min((inputs.voyages / 500) * 100, 100) * 10) / 10 },
 ];
 };

 const handleSort = (field) => {
 if (sortBy === field) {
 setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
 } else {
 setSortBy(field);
 setSortDir('desc');
 }
 };

 const getSortIcon = (field) => {
 if (sortBy !== field) return null;
 return sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
 };

 const getRiskColor = (risk) => {
 if (risk === 'Low') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
 if (risk === 'Low-Medium') return 'text-teal-700 bg-teal-50 border-teal-200';
 if (risk === 'Medium') return 'text-amber-700 bg-amber-50 border-amber-200';
 return 'text-rose-700 bg-rose-50 border-rose-200';
 };



 if (loading) {
 return (
 <div className="min-h-screen bg-[#f8f9fb]">
 <Navbar />
 <div className="flex items-center justify-center h-[60vh]">
 <div className="flex items-center gap-3 text-slate-400">
 <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
 Loading charterer directory...
 </div>
 </div>
 </div>
 );
 }

 if (loadError) {
 return (
 <div className="min-h-screen bg-[#f8f9fb]">
 <Navbar />
 <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
 <div className="card p-10 text-center">
 <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
 <p className="font-medium text-slate-800 mb-1">Could not load the charterer directory</p>
 <p className="text-sm text-slate-400 mb-4">{loadError}</p>
 <button
 onClick={fetchCharterers}
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
 <div className="min-h-screen bg-[#f8f9fb]">
 <Navbar />
 <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
 {/* Page Title */}
 <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Charterer & Vessel Trust Directory</h2>
 <p className="text-sm text-slate-400 mt-1">Vetted charterer reliability scoring with performance breakdown and default risk metrics</p>
 </div>
 <div className="flex items-center gap-3">
 {updatedAt && (
 <span className="text-xs text-slate-400">Updated {updatedAt.toLocaleTimeString()}</span>
 )}
 </div>
 </div>

 {/* Procurement Stats */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 <div className="card p-4 flex items-center gap-4">
 <div className="p-3 bg-teal-50 border border-teal-100">
 <Users className="w-5 h-5 text-teal-600" />
 </div>
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider">Charterers Available</p>
 <p className="text-2xl font-bold text-slate-900 font-mono">{charterers.length}</p>
 </div>
 </div>
 <div className="card p-4 flex items-center gap-4">
 <div className="p-3 bg-emerald-50 border border-emerald-100">
 <Clock className="w-5 h-5 text-emerald-600" />
 </div>
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider">Avg On-Time Delivery</p>
 <p className="text-2xl font-bold text-slate-900 font-mono">{avg(numValues)}<span className="text-sm text-slate-400">%</span></p>
 </div>
 </div>
 <div className="card p-4 flex items-center gap-4">
 <div className="p-3 bg-teal-50 border border-teal-100">
 <CreditCard className="w-5 h-5 text-teal-600" />
 </div>
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Payment Reliability</p>
 <p className="text-2xl font-bold text-slate-900 font-mono">{avg(payValues)}<span className="text-sm text-slate-400">%</span></p>
 </div>
 </div>
 <div className="card p-4 flex items-center gap-4">
 <div className="p-3 bg-emerald-50 border border-emerald-100">
 <TrendingUp className="w-5 h-5 text-emerald-600" />
 </div>
 <div>
 <p className="text-xs text-slate-400 uppercase tracking-wider">Completed Voyages</p>
 <p className="text-2xl font-bold text-slate-900 font-mono">{totalVoyages.toLocaleString()}</p>
 </div>
 </div>
 </div>

 {/* Search & Filter */}
 <div className="card p-4 mb-6">
 <div className="relative mb-3">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="text"
 placeholder="Search charterers by name, type, or country..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full input-field text-sm pl-10"
 />
 </div>
 <div className="flex flex-col sm:flex-row sm:items-center gap-3">
 <div className="flex gap-2 flex-wrap items-center">
 <span className="text-xs text-slate-400 font-medium mr-1">Risk:</span>
 {['all', 'Low', 'Low-Medium', 'Medium', 'Medium-High', 'High'].map((risk) => (
 <button
 key={risk}
 onClick={() => setRiskFilter(risk)}
 className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
 riskFilter === risk
 ? 'bg-teal-600 text-white'
 : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
 }`}
 >
 {risk === 'all' ? 'All Risk' : risk}
 </button>
 ))}
 </div>
 <p className="text-xs text-slate-400 sm:ml-auto whitespace-nowrap">
 Showing {filtered.length} of {charterers.length} charterers
 </p>
 </div>
 </div>

 {/* Charterers Table */}
 <div className="card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50/80">
 <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
 <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
 Charterer {getSortIcon('name')}
 </button>
 </th>
 <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
 <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
 <button onClick={() => handleSort('trust_score')} className="flex items-center gap-1 hover:text-slate-600 transition-colors mx-auto">
 Trust Score {getSortIcon('trust_score')}
 </button>
 </th>
 <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
 <button onClick={() => handleSort('on_time_delivery_rate')} className="flex items-center gap-1 hover:text-slate-600 transition-colors ml-auto">
 On-Time % {getSortIcon('on_time_delivery_rate')}
 </button>
 </th>
 <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
 <button onClick={() => handleSort('demurrage_incidents')} className="flex items-center gap-1 hover:text-slate-600 transition-colors mx-auto">
 Demurrage {getSortIcon('demurrage_incidents')}
 </button>
 </th>
 <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Disputes</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
 <button onClick={() => handleSort('avg_payment_days')} className="flex items-center gap-1 hover:text-slate-600 transition-colors ml-auto">
 Pay Days {getSortIcon('avg_payment_days')}
 </button>
 </th>
 <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
 <button onClick={() => handleSort('default_risk')} className="flex items-center gap-1 hover:text-slate-600 transition-colors mx-auto">
 Risk {getSortIcon('default_risk')}
 </button>
 </th>
 </tr>
 </thead>
 <tbody>
 {filtered.map((charterer) => (
 <React.Fragment key={charterer.id}>
 <tr
 onClick={() => setExpandedId(expandedId === charterer.id ? null : charterer.id)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 setExpandedId(expandedId === charterer.id ? null : charterer.id);
 }
 }}
 tabIndex={0}
 aria-expanded={expandedId === charterer.id}
 aria-label={`${charterer.name}: toggle details`}
 className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-500"
 >
 <td className="py-3 px-4">
 <div className="flex items-center gap-2">
 <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
 <div>
 <p className="font-medium text-slate-800">{charterer.name}</p>
 <p className="text-xs text-slate-400">{charterer.country} · {charterer.credit_rating}</p>
 </div>
 </div>
 </td>
 <td className="py-3 px-4 text-slate-500">{charterer.type}</td>
 <td className="py-3 px-4 text-center">
 <div className="flex justify-center">
 <TrustBadge score={charterer.trust_score} size="sm" />
 </div>
 </td>
 <td className="py-3 px-4 text-right">
 <span className={`font-semibold font-mono ${charterer.on_time_delivery_rate >= 85 ? 'text-emerald-600' : charterer.on_time_delivery_rate >= 70 ? 'text-amber-600' : 'text-rose-500'}`}>
 {charterer.on_time_delivery_rate}%
 </span>
 </td>
 <td className="py-3 px-4 text-center">
 <span className={`font-medium font-mono ${charterer.demurrage_incidents <= 3 ? 'text-emerald-600' : charterer.demurrage_incidents <= 6 ? 'text-amber-600' : 'text-rose-500'}`}>
 {charterer.demurrage_incidents}
 </span>
 </td>
 <td className="py-3 px-4 text-center">
 <span className={`font-medium font-mono ${charterer.dispute_count <= 1 ? 'text-emerald-600' : charterer.dispute_count <= 3 ? 'text-amber-600' : 'text-rose-500'}`}>
 {charterer.dispute_count}
 </span>
 </td>
 <td className="py-3 px-4 text-right">
 <span className={`font-medium font-mono ${charterer.avg_payment_days <= 30 ? 'text-emerald-600' : charterer.avg_payment_days <= 45 ? 'text-amber-600' : 'text-rose-500'}`}>
 {charterer.avg_payment_days}d
 </span>
 </td>
 <td className="py-3 px-4 text-center">
 <span className={`badge ${getRiskColor(charterer.default_risk)} border text-xs`}>
 {charterer.default_risk}
 </span>
 </td>
 </tr>
 {expandedId === charterer.id && (
 <tr className="bg-slate-50/50">
 <td colSpan={8} className="p-5">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-white p-3 border border-slate-200">
 <div className="flex items-center gap-2 mb-2">
 <Clock className="w-4 h-4 text-teal-600" />
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">On-Time Delivery</p>
 </div>
 <p className="text-xl font-bold text-slate-900 font-mono">{charterer.on_time_delivery_rate}%</p>
 <div className="mt-2 h-1.5 bg-slate-100 -full overflow-hidden">
 <div
 className={`h-full -full ${charterer.on_time_delivery_rate >= 85 ? 'bg-emerald-400' : charterer.on_time_delivery_rate >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
 style={{ width: `${charterer.on_time_delivery_rate}%` }}
 />
 </div>
 </div>
 <div className="bg-white p-3 border border-slate-200">
 <div className="flex items-center gap-2 mb-2">
 <AlertTriangle className="w-4 h-4 text-amber-500" />
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Demurrage History</p>
 </div>
 <p className="text-xl font-bold text-slate-900 font-mono">{charterer.demurrage_incidents} incidents</p>
 <p className="text-xs text-slate-400 mt-1">Total paid: ${(charterer.total_demurrage_paid / 1000).toFixed(0)}K</p>
 </div>
 <div className="bg-white p-3 border border-slate-200">
 <div className="flex items-center gap-2 mb-2">
 <FileText className="w-4 h-4 text-rose-500" />
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dispute Record</p>
 </div>
 <p className="text-xl font-bold text-slate-900 font-mono">{charterer.dispute_count} disputes</p>
 <p className="text-xs text-slate-400 mt-1">{charterer.dispute_resolution_rate}% resolution rate</p>
 </div>
 <div className="bg-white p-3 border border-slate-200">
 <div className="flex items-center gap-2 mb-2">
 <CreditCard className="w-4 h-4 text-teal-600" />
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Payment Performance</p>
 </div>
 <p className="text-xl font-bold text-slate-900 font-mono">{charterer.avg_payment_days} days avg</p>
 <p className="text-xs text-slate-400 mt-1">Credit: {charterer.credit_rating}</p>
 </div>
 </div>

 <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-white p-3 border border-slate-200">
 <div className="flex items-center gap-2 mb-1">
 <Award className="w-4 h-4 text-teal-600" />
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contract History</p>
 </div>
 <p className="text-sm text-slate-800">{charterer.contracts_active} active · {charterer.total_contracts} total</p>
 </div>
 <div className="bg-white p-3 border border-slate-200">
 <div className="flex items-center gap-2 mb-1">
 <TrendingUp className="w-4 h-4 text-emerald-600" />
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Volume</p>
 </div>
 <p className="text-sm text-slate-800">{(charterer.total_volume_mt / 1e6).toFixed(2)}M MT lifetime</p>
 </div>
 <div className="bg-white p-3 border border-slate-200">
 <div className="flex items-center gap-2 mb-1">
 <Users className="w-4 h-4 text-slate-400" />
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Charterer Type</p>
 </div>
 <p className="text-sm text-slate-800">{charterer.type}</p>
 </div>
 </div>

 <div className="mt-4 p-3 bg-white border border-slate-200">
 <div className="flex items-center justify-between mb-2">
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trust-Score Breakdown</p>
 </div>
 {(() => {
 const factors = scoreFactors(charterer);
 if (!factors) {
 return (
 <p className="text-xs text-slate-400">
 Factor inputs unavailable for this record — showing the official score only.
 </p>
 );
 }
 return (
 <div className="space-y-2">
 {factors.map((f) => (
 <div key={f.label}>
 <div className="flex justify-between text-xs mb-1">
 <span className="text-slate-600">{f.label} <span className="text-slate-400">({Math.round(f.weight * 100)}%)</span></span>
 <span className="font-mono font-medium text-slate-800">{f.score} → +{(f.score * f.weight).toFixed(1)}</span>
 </div>
 <div className="h-1.5 bg-slate-100 -full overflow-hidden">
 <div
 className={`h-full -full ${f.score >= 85 ? 'bg-emerald-400' : f.score >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
 style={{ width: `${Math.min(f.score, 100)}%` }}
 />
 </div>
 </div>
 ))}
 <p className="text-xs text-slate-400 pt-1">
 Official score <span className="font-mono font-medium text-slate-700">{charterer.trust_score}</span> is computed by the backend scoring model.
 </p>
 </div>
 );
 })()}
 </div>

 <div className="mt-4 p-3 bg-white border border-slate-200">
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Analyst Notes</p>
 <p className="text-sm text-slate-600">{charterer.notes}</p>
 </div>
 </td>
 </tr>
 )}
 </React.Fragment>
 ))}
 </tbody>
 </table>
 </div>
 {filtered.length === 0 && (
 <div className="p-8 text-center text-slate-400">
 No charterers found matching your filters.
 </div>
 )}
 </div>

 {/* Scoring model reference */}
 <div className="card p-4 mt-6">
 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">How trust scoring works</p>
 <p className="text-xs text-slate-600 leading-relaxed">
 Each trust score is a weighted composite (0–100) of vetting inputs: on-time delivery 35% · payment reliability 25% · cargo handling 20% · experience 10% · volume 10%. Expand a charterer row to see its factor breakdown.
 </p>
 </div>
 </main>
 </div>
 );
}
