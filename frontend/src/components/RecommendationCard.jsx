import { Link } from 'react-router-dom';
import { Zap, Clock, Split, ArrowRight, TrendingUp, Fuel, AlertTriangle } from 'lucide-react';

const actionConfig = {
  'CHARTER NOW': {
    icon: Zap,
    text: 'text-slate-900',
    iconColor: 'text-slate-800',
    label: 'Charter Now',
  },
  'WAIT / SPOT MARKET': {
    icon: Clock,
    text: 'text-slate-900',
    iconColor: 'text-slate-800',
    label: 'Wait / Spot Market',
  },
  'SPLIT SHIPMENT': {
    icon: Split,
    text: 'text-slate-900',
    iconColor: 'text-slate-800',
    label: 'Split Shipment',
  },
};

export default function RecommendationCard({ recommendation, compact = false }) {
  if (!recommendation) return null;

  const config = actionConfig[recommendation.action] || actionConfig['CHARTER NOW'];
  const ActionIcon = config.icon;

  return (
    <div className={`card card-hover p-6 animate-slide-up`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 -ml-1.5 rounded-md">
            <ActionIcon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className={`text-lg font-bold tracking-tight ${config.text}`}>{recommendation.action}</h3>
            <p className="text-sm text-slate-500 font-medium">{recommendation.route_name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 mb-1 justify-end">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Confidence</span>
            <span className={`text-lg font-bold tracking-tight ${config.text}`}>{recommendation.confidence_score}%</span>
          </div>
          <div className="w-24 h-1 bg-slate-100 ml-auto overflow-hidden">
            <div
              className={`h-full bg-slate-800 transition-all duration-500`}
              style={{ width: `${recommendation.confidence_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rationale */}
      <p className="text-sm text-slate-600 leading-relaxed mb-6">{recommendation.rationale}</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Current Rate</p>
          <p className="text-base font-bold text-slate-900 tracking-tight">${recommendation.current_rate}/MT</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">30d Projection</p>
          <p className={`text-base font-bold tracking-tight ${recommendation.projected_rate_change > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ${recommendation.projected_rate_30d}/MT
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Rate Change</p>
          <p className={`text-base font-bold tracking-tight ${recommendation.projected_rate_change.startsWith('-') ? 'text-emerald-600' : 'text-rose-600'}`}>
            {recommendation.projected_rate_change}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Est. Savings</p>
          <p className="text-base font-bold text-emerald-600 tracking-tight">
            ${(recommendation.projected_savings_total / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded-md">{recommendation.recommended_vessel_class}</span>
        <span className="text-xs font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded-md">{recommendation.recommended_charter_type}</span>
        <span className="text-xs font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded-md">{recommendation.cargo_type}</span>
        <span className="text-xs font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded-md">{(recommendation.recommended_volume_mt / 1000).toFixed(0)}K MT</span>
        <span className="text-xs font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded-md">{recommendation.time_horizon}</span>
      </div>

      {!compact && (
        <>
          {/* Cost Benefit & Fuel Impact container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-4 border-t border-slate-100">
            {/* Cost Benefit */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800">Cost-Benefit Analysis</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Charter Now</p>
                  <p className="font-semibold text-slate-900 tracking-tight">${(recommendation.cost_benefit.charter_now_cost / 1e6).toFixed(2)}M</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Wait 30d</p>
                  <p className="font-semibold text-slate-900 tracking-tight">${(recommendation.cost_benefit.wait_30d_cost / 1e6).toFixed(2)}M</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Savings</p>
                  <p className="font-semibold text-emerald-600 tracking-tight">
                    ${(recommendation.cost_benefit.savings / 1e3).toFixed(0)}K ({recommendation.cost_benefit.savings_pct}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Fuel Impact */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Fuel className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800">Bunker Fuel Impact</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Current VLSFO</p>
                  <p className="font-semibold text-slate-900 tracking-tight">${recommendation.fuel_impact.current_bunker_cost}/MT</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 mx-2" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">30d Projection</p>
                  <p className={`font-semibold tracking-tight ${recommendation.fuel_impact.bunker_impact_pct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ${recommendation.fuel_impact.projected_bunker_cost_30d}/MT
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Impact</p>
                  <p className={`font-semibold tracking-tight ${recommendation.fuel_impact.bunker_impact_pct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {recommendation.fuel_impact.bunker_impact_pct > 0 ? '+' : ''}{recommendation.fuel_impact.bunker_impact_pct}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="pt-4 border-t border-slate-100 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">Key Risk Factors</p>
            </div>
            <ul className="space-y-1.5">
              {recommendation.risk_factors.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                  <span className="text-slate-400 mt-[1px]">—</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Link
        to="/recommendations/picks"
        className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-slate-900 hover:text-white bg-slate-50 hover:bg-slate-900 transition-colors rounded-md"
      >
        View Full Analysis
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </Link>
    </div>
  );
}