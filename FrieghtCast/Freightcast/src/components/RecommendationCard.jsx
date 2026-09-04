import { Link } from 'react-router-dom';
import { Zap, Clock, Split, ArrowRight, TrendingUp, Fuel, AlertTriangle } from 'lucide-react';

const actionConfig = {
  'CHARTER NOW': {
    icon: Zap,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    label: 'Charter Now',
  },
  'WAIT / SPOT MARKET': {
    icon: Clock,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100',
    label: 'Wait / Spot Market',
  },
  'SPLIT SHIPMENT': {
    icon: Split,
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    iconBg: 'bg-teal-100',
    label: 'Split Shipment',
  },
};

export default function RecommendationCard({ recommendation, compact = false }) {
  if (!recommendation) return null;

  const config = actionConfig[recommendation.action] || actionConfig['CHARTER NOW'];
  const ActionIcon = config.icon;

  return (
    <div className={`card card-hover p-5 border ${config.border} animate-slide-up`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${config.iconBg}`}>
            <ActionIcon className={`w-5 h-5 ${config.text}`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${config.text}`}>{recommendation.action}</h3>
            <p className="text-sm text-slate-500">{recommendation.route_name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-slate-400">Confidence</span>
            <span className={`text-lg font-bold ${config.text}`}>{recommendation.confidence_score}%</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${config.iconBg} transition-all duration-500`}
              style={{ width: `${recommendation.confidence_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rationale */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{recommendation.rationale}</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Current Rate</p>
          <p className="text-base font-bold text-slate-900">${recommendation.current_rate}/MT</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">30d Projection</p>
          <p className={`text-base font-bold ${recommendation.projected_rate_change > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
            ${recommendation.projected_rate_30d}/MT
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Rate Change</p>
          <p className={`text-base font-bold ${recommendation.projected_rate_change.startsWith('-') ? 'text-emerald-600' : 'text-rose-500'}`}>
            {recommendation.projected_rate_change}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Est. Savings</p>
          <p className="text-base font-bold text-emerald-600">
            ${(recommendation.projected_savings_total / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="badge bg-slate-100 text-slate-600">{recommendation.recommended_vessel_class}</span>
        <span className="badge bg-slate-100 text-slate-600">{recommendation.recommended_charter_type}</span>
        <span className="badge bg-slate-100 text-slate-600">{recommendation.cargo_type}</span>
        <span className="badge bg-slate-100 text-slate-600">{(recommendation.recommended_volume_mt / 1000).toFixed(0)}K MT</span>
        <span className="badge bg-slate-100 text-slate-600">{recommendation.time_horizon}</span>
      </div>

      {!compact && (
        <>
          {/* Cost Benefit */}
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <p className="text-sm font-medium text-slate-700">Cost-Benefit Analysis</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Charter Now</p>
                <p className="font-semibold text-slate-900">${(recommendation.cost_benefit.charter_now_cost / 1e6).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Wait 30d</p>
                <p className="font-semibold text-slate-900">${(recommendation.cost_benefit.wait_30d_cost / 1e6).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Savings</p>
                <p className="font-semibold text-emerald-600">
                  ${(recommendation.cost_benefit.savings / 1e3).toFixed(0)}K ({recommendation.cost_benefit.savings_pct}%)
                </p>
              </div>
            </div>
          </div>

          {/* Fuel Impact */}
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Fuel className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-medium text-slate-700">Bunker Fuel Impact</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs text-slate-400">Current VLSFO</p>
                <p className="font-semibold text-slate-900">${recommendation.fuel_impact.current_bunker_cost}/MT</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div>
                <p className="text-xs text-slate-400">30d Projection</p>
                <p className={`font-semibold ${recommendation.fuel_impact.bunker_impact_pct > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  ${recommendation.fuel_impact.projected_bunker_cost_30d}/MT
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Impact</p>
                <p className={`font-semibold ${recommendation.fuel_impact.bunker_impact_pct > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {recommendation.fuel_impact.bunker_impact_pct > 0 ? '+' : ''}{recommendation.fuel_impact.bunker_impact_pct}%
                </p>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-medium text-slate-700">Key Risk Factors</p>
            </div>
            <ul className="space-y-1">
              {recommendation.risk_factors.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Link
        to={`/recommendations/simulator?route=${recommendation.route_id}`}
        className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-teal-600 hover:text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-all"
      >
        View Full Analysis
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
1