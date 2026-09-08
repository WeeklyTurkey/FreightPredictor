import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';

export default function MetricCard({ icon: Icon, label, value, unit, changePct, trend, subtitle, chartData, disableGraph = false, linkTo }) {
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-400';

  // Close expanded graph when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setIsGraphExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use passed data or fallback sparkline
  const dataToUse = useMemo(() => {
    if (chartData && chartData.length > 0) return chartData;
    let baseVal = 100;
    const data = [];
    for (let i = 0; i < 14; i++) {
      baseVal += (trend === 'up' ? 2 : trend === 'down' ? -2 : 0) + (Math.random() - 0.5) * 10;
      data.push({ day: `Day ${i + 1}`, value: baseVal });
    }
    return data;
  }, [trend, chartData]);

  const handleActivate = () => {
    if (linkTo) { navigate(linkTo); return; }
    if (!disableGraph) setIsGraphExpanded(!isGraphExpanded);
  };

  return (
    <div
      ref={cardRef}
      className={`card card-hover p-5 animate-fade-in transition-all duration-300 flex flex-col relative ${(disableGraph && !linkTo) ? '' : 'cursor-pointer'} ${linkTo ? 'focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-2 hover:border-teal-200' : ''}`}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (linkTo && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleActivate();
        }
      }}
      role={linkTo ? 'link' : undefined}
      tabIndex={linkTo ? 0 : undefined}
      aria-label={linkTo ? `${label}: open details` : undefined}
      title={linkTo ? 'Click to view graph details' : (disableGraph ? undefined : 'Click to toggle expanded chart')}
    >
      <div className="flex items-start justify-between mb-2">
        {Icon ? (
          <div className="p-1 -ml-1 rounded-md text-slate-800">
            <Icon className="w-5 h-5" strokeWidth={1.5} />
          </div>
        ) : (
          <div className="w-5 h-5" /> // Keep spacing if no icon
        )}
        
        {changePct !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            <TrendIcon className="w-4 h-4" strokeWidth={2} />
            {changePct > 0 ? '+' : ''}{changePct}%
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between w-full">
        {/* Text Content */}
        <div className="relative z-10 pointer-events-none flex-1">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">{value}</span>
            {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        {/* Mini Graph (Minimized state beside the text) */}
        {!disableGraph && (
          <div className={`h-12 w-24 ml-4 transition-opacity duration-300 ${isGraphExpanded ? 'opacity-0' : 'opacity-50'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataToUse}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#64748b" 
                  strokeWidth={1.5} 
                  dot={false} 
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Expanded Graph (Absolute overlay so it doesn't shift page layout) */}
      {isGraphExpanded && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-slate-200 shadow-xl rounded-xl z-50 h-48 animate-fade-in"
          onClick={(e) => e.stopPropagation()} // Prevent card click from immediately closing it
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">{label} History</span>
            <button 
              onClick={() => setIsGraphExpanded(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={dataToUse}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0f172a" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={true}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '4px 8px' }}
                labelStyle={{ display: 'none' }}
                itemStyle={{ fontSize: '12px', fontWeight: 500, color: '#0f172a' }}
                formatter={(val) => [`${val.toFixed(2)}`, '']}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
