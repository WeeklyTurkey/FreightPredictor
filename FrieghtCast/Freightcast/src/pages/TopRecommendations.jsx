import { useEffect, useState } from 'react';
import {
  Lightbulb,
  Zap,
  Clock,
  Split,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import RecommendationCard from '../components/RecommendationCard';
import { getRecommendations } from '../api/freightService';

export default function TopRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations().then((recs) => {
      setRecommendations(recs);
      setLoading(false);
    });
  }, []);

  const topRec = recommendations[0];
  const actionIcon = topRec?.action === 'CHARTER NOW' ? Zap : topRec?.action === 'WAIT / SPOT MARKET' ? Clock : Split;
  const actionColor = topRec?.action_type === 'urgent' ? 'emerald' : topRec?.action_type === 'hold' ? 'amber' : 'teal';

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading recommendations...
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Top AI Recommendations</h2>
          <p className="text-sm text-slate-400 mt-1">AI-driven charter timing guidance with cost-benefit analysis</p>
        </div>

        {/* Top Recommendation Banner */}
        {topRec && (
          <div className={`card p-6 mb-6 border-2 ${
            actionColor === 'emerald' ? 'border-emerald-200 bg-emerald-50/30' :
            actionColor === 'amber' ? 'border-amber-200 bg-amber-50/30' :
            'border-teal-200 bg-teal-50/30'
          } animate-slide-up`}>
            <div className="flex flex-col lg:flex-row items-start gap-6">
              <div className="flex items-start gap-4 lg:w-1/3">
                <div className={`p-4 rounded-xl ${
                  actionColor === 'emerald' ? 'bg-emerald-100' :
                  actionColor === 'amber' ? 'bg-amber-100' :
                  'bg-teal-100'
                }`}>
                  {(() => {
                    const Icon = actionIcon;
                    return <Icon className={`w-8 h-8 ${
                      actionColor === 'emerald' ? 'text-emerald-700' :
                      actionColor === 'amber' ? 'text-amber-700' :
                      'text-teal-700'
                    }`} />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${
                      actionColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                      actionColor === 'amber' ? 'bg-amber-100 text-amber-700' :
                      'bg-teal-100 text-teal-700'
                    }`}>
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Top Recommendation
                    </span>
                  </div>
                  <h3 className={`text-2xl font-bold mb-1 ${
                    actionColor === 'emerald' ? 'text-emerald-700' :
                    actionColor === 'amber' ? 'text-amber-700' :
                    'text-teal-700'
                  }`}>
                    {topRec.action}
                  </h3>
                  <p className="text-sm text-slate-500">{topRec.route_name} · {topRec.cargo_type}</p>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{topRec.rationale}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Projected Rate Change</p>
                    <p className={`text-lg font-bold font-mono ${topRec.projected_rate_change.startsWith('-') ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {topRec.projected_rate_change}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Est. Savings</p>
                    <p className="text-lg font-bold text-emerald-600 font-mono">${(topRec.projected_savings_total / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Time Horizon</p>
                    <p className="text-lg font-bold text-slate-900">{topRec.time_horizon}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</p>
                    <p className="text-lg font-bold text-slate-900 font-mono">{topRec.confidence_score}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Recommendations */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-teal-600" />
            All Route Recommendations
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} compact={true} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
