import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Lightbulb, Users, Ship } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Pipeline Overview' },
  { to: '/rates', label: 'Rate Trends', icon: TrendingUp, description: 'ML Forecast & History' },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb, description: 'Charter Timing' },
  { to: '/charterers', label: 'Charterers', icon: Users, description: 'Trust Directory' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-navy-950/40 backdrop-blur-xl border-r border-white/10 min-h-[calc(100vh-89px)] sticky top-[89px] hidden md:block">
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'text-navy-300 hover:bg-navy-800 hover:text-navy-100 border border-transparent'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">{item.label}</span>
              <span className="text-[10px] text-navy-500 mt-0.5">{item.description}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Fleet Status Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-navy-800">
        <div className="flex items-center gap-2 px-3 py-2 bg-navy-800/50 rounded-lg">
          <div className="relative">
            <Ship className="w-4 h-4 text-teal-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-medium text-navy-200">Fleet Online</p>
            <p className="text-[10px] text-navy-500">23 of 31 vessels ready</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
