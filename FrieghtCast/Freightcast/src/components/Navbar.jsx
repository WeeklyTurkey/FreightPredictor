import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Ship,
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  Users,
  Activity,
  Anchor,
  Gauge,
  Navigation,
  BarChart3,
  Table,
  Download,
  Calculator,
  Sliders,
  FileText,
  Shield,
  CreditCard,
  AlertTriangle,
  Award,
  Search,
  Bell,
  Menu,
  X,
} from 'lucide-react';

const navSections = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    items: [
      { label: 'Pipeline Overview', desc: 'KPIs, fleet status & market data', path: '/', icon: Activity },
      { label: 'Active Voyages', desc: 'Inbound vessel tracking', path: '/voyages', icon: Ship },
      { label: 'Port Status', desc: 'East coast congestion metrics', path: '/ports', icon: Anchor },
      { label: 'Fleet Readiness', desc: 'Vessel availability dashboard', path: '/fleet', icon: Gauge },
    ],
  },
  {
    label: 'Rate Trends',
    path: '/rates/forecast',
    icon: TrendingUp,
    items: [
      { label: 'ML Forecast', desc: '90-day Prophet projections', path: '/rates/forecast', icon: TrendingUp },
      { label: 'Rate Breakdown', desc: 'Base freight vs BAF analysis', path: '/rates/breakdown', icon: Table },
    ],
  },
  {
    label: 'Recommendations',
    path: '/recommendations/picks',
    icon: Lightbulb,
    items: [
      { label: 'Top Picks', desc: 'AI-driven charter timing', path: '/recommendations/picks', icon: Lightbulb },
      { label: 'Scenario Simulator', desc: 'Spot vs time charter costs', path: '/recommendations/simulator', icon: Calculator },
    ],
  },
  {
    label: 'Charterers',
    path: '/charterers',
    icon: Users,
    items: [
      { label: 'Trust Directory', desc: 'Vetted charterer scores', path: '/charterers', icon: Shield },
    ],
  },
];

function NavDropdown({ section, isActive }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = () => {
    const lastPath = sessionStorage.getItem(`last_path_${section.label}`) || section.items[0].path;
    navigate(lastPath);
    setOpen(false);
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={handleNavigate}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'text-teal-700 bg-teal-50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <section.icon className="w-4 h-4" />
        {section.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 pt-1 w-72 z-50 animate-slide-down">
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-2">
            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
              <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                <item.icon className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const activeSection = navSections.find((section) => 
    section.items.some((item) => item.path === location.pathname)
  );

  useEffect(() => {
    if (activeSection) {
      sessionStorage.setItem(`last_path_${activeSection.label}`, location.pathname);
    }
  }, [location.pathname, activeSection]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="p-1.5 bg-teal-600 rounded-lg">
                <Ship className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 font-bold text-lg leading-none tracking-tight">FreightCast</h1>
                <p className="text-slate-400 text-[10px] leading-none mt-0.5 font-medium">Intelligent Freight Forecasting</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navSections.map((section) => (
                <NavDropdown key={section.label} section={section} isActive={isActive(section.path)} />
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors hidden md:flex">
                <Search className="w-4.5 h-4.5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative hidden md:flex">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full" />
              </button>
              <div className="hidden md:block w-px h-6 bg-slate-200 mx-1" />
              <div className="hidden md:flex items-center gap-2 pl-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  FC
                </div>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navSections.map((section) => (
                <div key={section.label}>
                  <button
                    onClick={() => {
                      navigate(section.path);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(section.path)
                        ? 'text-teal-700 bg-teal-50'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    {section.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Contextual Sub-Navigation */}
      {activeSection && activeSection.items.length > 1 && (
        <div className="sticky top-16 z-40 bg-white/60 backdrop-blur-md border-b border-slate-200/60 hidden md:block animate-fade-in">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              {activeSection.items.map((item) => {
                const isItemActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      isItemActive
                        ? 'bg-slate-200/50 text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isItemActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
