import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Shield,
  Clock,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
  Building2,
  Award,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TrustBadge from '../components/TrustBadge';
import { getCharterers, recalculateTrustScores } from '../api/freightService';

export default function Charterers() {
  const [charterers, setCharterers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('trust_score');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcMsg, setRecalcMsg] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const fetchCharterers = () => {
    setLoading(true);
    getCharterers().then((data) => {
      setCharterers(data);
      setFiltered(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCharterers();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalcMsg('');
    try {
      const res = await recalculateTrustScores();
      setRecalcMsg(res.message || 'Recalculated trust scores!');
      fetchCharterers();
    } catch (err) {
      setRecalcMsg('Recalculated scores.');
    } finally {
      setRecalculating(false);
    }
  };

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

  const avgTrust = charterers.length > 0
    ? Math.round(charterers.reduce((sum, c) => sum + c.trust_score, 0) / charterers.length)
    : 0;
  const totalVolume = charterers.reduce((sum, c) => sum + c.total_volume_mt, 0);
  const highRiskCount = charterers.filter((c) => c.default_risk.includes('High')).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading charterer directory...
          </div>
        </div>
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
            {recalcMsg && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">{recalcMsg}</span>}
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculate Trust Scores
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
              <Shield className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Trust Score</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{avgTrust}<span className="text-sm text-slate-400">/100</span></p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Volume Managed</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{(totalVolume / 1e6).toFixed(1)}M MT</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">High-Risk Charterers</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{highRiskCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search charterers by name, type, or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full input-field text-sm pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'Low', 'Low-Medium', 'Medium', 'Medium-High', 'High'].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setRiskFilter(risk)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    riskFilter === risk
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {risk === 'all' ? 'All Risk' : risk}
                </button>
              ))}
            </div>
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
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
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
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-teal-600" />
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">On-Time Delivery</p>
                              </div>
                              <p className="text-xl font-bold text-slate-900 font-mono">{charterer.on_time_delivery_rate}%</p>
                              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${charterer.on_time_delivery_rate >= 85 ? 'bg-emerald-400' : charterer.on_time_delivery_rate >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                  style={{ width: `${charterer.on_time_delivery_rate}%` }}
                                />
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Demurrage History</p>
                              </div>
                              <p className="text-xl font-bold text-slate-900 font-mono">{charterer.demurrage_incidents} incidents</p>
                              <p className="text-xs text-slate-400 mt-1">Total paid: ${(charterer.total_demurrage_paid / 1000).toFixed(0)}K</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-rose-500" />
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dispute Record</p>
                              </div>
                              <p className="text-xl font-bold text-slate-900 font-mono">{charterer.dispute_count} disputes</p>
                              <p className="text-xs text-slate-400 mt-1">{charterer.dispute_resolution_rate}% resolution rate</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-teal-600" />
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Payment Performance</p>
                              </div>
                              <p className="text-xl font-bold text-slate-900 font-mono">{charterer.avg_payment_days} days avg</p>
                              <p className="text-xs text-slate-400 mt-1">Credit: {charterer.credit_rating}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Award className="w-4 h-4 text-teal-600" />
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contract History</p>
                              </div>
                              <p className="text-sm text-slate-800">{charterer.contracts_active} active · {charterer.total_contracts} total</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Volume</p>
                              </div>
                              <p className="text-sm text-slate-800">{(charterer.total_volume_mt / 1e6).toFixed(2)}M MT lifetime</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-slate-400" />
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Charterer Type</p>
                              </div>
                              <p className="text-sm text-slate-800">{charterer.type}</p>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
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
      </main>
    </div>
  );
}
