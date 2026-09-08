import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Ship,
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  Users,
  Activity,
  Anchor,
  Fuel,
  Calculator,
  Shield,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Table,
  ArrowRight,
} from 'lucide-react';

const navSections = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    items: [
      { label: 'Pipeline Overview', desc: 'KPIs, fleet status & market data', path: '/dashboard', icon: Activity },
      { label: 'Active Voyages', desc: 'Inbound vessel tracking', path: '/voyages', icon: Ship },
      { label: 'Port Status', desc: 'East coast congestion metrics', path: '/ports', icon: Anchor },
    ],
  },
  {
    label: 'Rate Trends',
    path: '/rates/forecast',
    icon: TrendingUp,
    items: [
      { label: 'ML Forecast', desc: '90-day Prophet projections', path: '/rates/forecast', icon: TrendingUp },
      { label: 'Rate Breakdown', desc: 'Base freight vs BAF analysis', path: '/rates/breakdown', icon: Table },
      { label: 'BDI Index', desc: 'Baltic Dry Index daily trends', path: '/rates/index-graph?type=BDI', icon: Activity },
      { label: 'VLSFO Index', desc: 'VLSFO bunker fuel price trends', path: '/rates/index-graph?type=VLSFO', icon: Fuel },
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

/* ───────────────────────────────────────────────────────────
   Full-width mega-dropdown — white frosted glass panel
   ─────────────────────────────────────────────────────────── */
function MegaDropdown({ section, onClose, onNavigate }) {
  return (
    <div className="apple-dropdown" onMouseLeave={onClose}>
      <div className="max-w-[980px] mx-auto px-6 py-6">
        {/* Section title */}
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          {section.label}
        </p>

        {/* Items grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
          {section.items.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.path)}
              className="group flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-slate-50"
            >
              <div className="mt-0.5 p-2 rounded-lg bg-slate-100 group-hover:bg-teal-50 transition-colors">
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-800 group-hover:text-teal-700 transition-colors leading-tight">
                  {item.label}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {item.desc}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-transparent group-hover:text-teal-500 transition-all mt-1 -translate-x-1 group-hover:translate-x-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Search overlay — light Apple-style
   ─────────────────────────────────────────────────────────── */
function SearchOverlay({ onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 top-[44px] bg-black/20 z-40 animate-fade-in" onClick={onClose} />

      {/* Search bar */}
      <div className="absolute top-0 left-0 right-0 h-[44px] bg-white/95 backdrop-blur-2xl z-50 flex items-center border-b border-slate-200/60">
        <div className="max-w-[680px] mx-auto w-full px-6 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search FreightCast"
            className="w-full bg-transparent text-[15px] text-slate-800 placeholder-slate-300 outline-none font-light"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────────────────────────────────────────
   Main Navbar — White Apple-inspired
   ─────────────────────────────────────────────────────────── */
export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const closeTimer = useRef(null);

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

  // Close everything on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleDropdownEnter = useCallback((label) => {
    clearTimeout(closeTimer.current);
    setActiveDropdown(label);
    setSearchOpen(false);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  }, []);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    setActiveDropdown(null);
    setMobileOpen(false);
  }, [navigate]);

  const currentDropdown = navSections.find((s) => s.label === activeDropdown);

  return (
    <>
      {/* ── White Apple-style Navbar ── */}
      <header className="apple-nav">
        <nav className="relative w-full h-full px-4 lg:px-8 flex items-center justify-between">
          {/* ── Logo (left) ── */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 shrink-0 group"
            onMouseEnter={() => { setActiveDropdown(null); setSearchOpen(false); }}
          >
            <div className="p-1 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 group-hover:from-teal-400 group-hover:to-emerald-500 transition-all duration-300 shadow-sm">
              <Ship className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 font-semibold text-[14px] tracking-tight group-hover:text-teal-700 transition-colors">
              FreightCast
            </span>
          </Link>

          {/* ── Desktop Nav Links (horizontally centered) ── */}
          <div className="hidden md:flex items-center gap-0 absolute left-1/2 -translate-x-1/2">
            {navSections.map((section) => {
              const active = isActive(section.path);
              return (
                <div
                  key={section.label}
                  onMouseEnter={() => handleDropdownEnter(section.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    onClick={() => {
                      const lastPath = sessionStorage.getItem(`last_path_${section.label}`) || section.items[0].path;
                      handleNavigate(lastPath);
                    }}
                    className={`apple-nav-link ${active ? 'apple-nav-link--active' : ''}`}
                  >
                    {section.label}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Right icons ── */}
          <div className="flex items-center gap-0.5">
            <button
              className="apple-nav-icon hidden md:flex"
              onClick={() => { setSearchOpen(!searchOpen); setActiveDropdown(null); }}
              onMouseEnter={() => setActiveDropdown(null)}
            >
              <Search className="w-[15px] h-[15px]" />
            </button>

            <button
              className="apple-nav-icon hidden md:flex relative"
              onMouseEnter={() => setActiveDropdown(null)}
            >
              <Bell className="w-[15px] h-[15px]" />
              <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-teal-500 rounded-full" />
            </button>

            <button
              className="apple-nav-icon hidden md:flex"
              onClick={async () => { await logout(); navigate('/'); }}
              onMouseEnter={() => setActiveDropdown(null)}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-[15px] h-[15px]" />
            </button>

            <button
              onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); }}
              className="apple-nav-icon md:hidden"
            >
              {mobileOpen
                ? <X className="w-[17px] h-[17px]" />
                : <Menu className="w-[17px] h-[17px]" />
              }
            </button>
          </div>
        </nav>

        {/* ── Search Overlay ── */}
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      </header>

      {/* ── Desktop Mega-Dropdown ── */}
      {currentDropdown && !searchOpen && (
        <div
          className="fixed top-[44px] left-0 right-0 z-40"
          onMouseEnter={() => handleDropdownEnter(currentDropdown.label)}
          onMouseLeave={handleDropdownLeave}
        >
          <MegaDropdown
            section={currentDropdown}
            onClose={() => setActiveDropdown(null)}
            onNavigate={handleNavigate}
          />
          {/* Scrim */}
          <div
            className="fixed inset-0 top-[44px] bg-black/15 -z-10 animate-fade-in"
            onClick={() => setActiveDropdown(null)}
          />
        </div>
      )}

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[44px] z-50 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />

          <div className="relative bg-white/95 backdrop-blur-2xl h-full overflow-y-auto apple-mobile-menu border-t border-slate-200/60">
            <div className="p-5 space-y-1">
              {navSections.map((section) => (
                <div key={section.label}>
                  <button
                    onClick={() => setMobileExpanded(mobileExpanded === section.label ? null : section.label)}
                    className="w-full flex items-center justify-between py-3 border-b border-slate-100"
                  >
                    <span className={`text-[17px] font-semibold transition-colors ${
                      isActive(section.path) ? 'text-teal-700' : 'text-slate-800'
                    }`}>
                      {section.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${
                      mobileExpanded === section.label ? 'rotate-180' : ''
                    }`} />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ${
                    mobileExpanded === section.label ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="py-2 pl-3 space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleNavigate(item.path)}
                          className="w-full flex items-center gap-3 py-2.5 text-left group"
                        >
                          <item.icon className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
                          <div>
                            <p className="text-[15px] text-slate-600 group-hover:text-teal-700 transition-colors">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-slate-300 mt-0.5">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
