import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  TrendingUp,
  Shield,
  DollarSign,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowRight,
  Anchor,
  BarChart3,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Waves,
  CheckCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setError('');
    setShowPassword(false);
    setRegisterSuccess(false);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (activeTab === 'login') {
        await login(username, password);
        navigate('/dashboard');
      } else {
        await register(username, password, email);
        setRegisterSuccess(true);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'ML Forecasting',
      desc: '90-day Prophet projections with confidence intervals for all major routes.',
      detail: 'Our forecasting engine uses Facebook Prophet trained on historical Baltic Exchange and S&P Platts data. It generates 90-day forward curves for Capesize, Panamax, and Supramax segments across 15+ trade routes, complete with upper/lower confidence bands so you can plan around uncertainty.',
      accent: 'teal',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      icon: DollarSign,
      title: 'Cost Optimization',
      desc: 'Landed cost breakdowns with BAF, demurrage, and port handling analysis.',
      detail: 'Beyond headline freight rates, FreightCast calculates the true landed cost of every voyage — factoring in Bunker Adjustment Factor (BAF), canal tolls, port charges, demurrage risk, and laytime estimates. Compare routes side-by-side to find the lowest total cost option.',
      accent: 'amber',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      icon: Shield,
      title: 'Trust Scoring',
      desc: 'Charterer reliability scores based on historical performance.',
      detail: 'Each charterer receives a composite trust score derived from payment punctuality, cargo declaration accuracy, laytime disputes, and historical fixture compliance. Scores update with every new fixture to give you an up-to-date view of counterparty risk.',
      accent: 'rose',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      iconColor: 'text-rose-600',
    },
  ];

  const stats = [
    { value: '15+', label: 'Trade Routes', icon: Anchor, bgColor: 'bg-teal-50', borderColor: 'border-teal-100', iconColor: 'text-teal-600' },
    { value: '90', label: 'Day Forecasts', icon: BarChart3, bgColor: 'bg-amber-50', borderColor: 'border-amber-100', iconColor: 'text-amber-600' },
    { value: '24/7', label: 'Monitoring', icon: Waves, bgColor: 'bg-slate-50', borderColor: 'border-slate-100', iconColor: 'text-slate-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* ============================================================ */}
      {/* NAV BAR — matches dashboard Navbar style */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-teal-600 rounded-lg">
                <Ship className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 font-bold text-lg leading-none tracking-tight">FreightCast</h1>
                <p className="text-slate-400 text-[10px] leading-none mt-0.5 font-medium">Intelligent Freight Forecasting</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================ */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="max-w-2xl">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-full mb-6 transition-all duration-700 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-teal-700 text-xs font-medium tracking-wide">Maritime Intelligence Platform</span>
            </div>

            {/* Headline */}
            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.15] tracking-tight mb-5 transition-all duration-700 delay-150 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Intelligent{' '}
              <span className="text-teal-600">Freight Forecasting</span>{' '}
              & Vessel Chartering
            </h2>

            {/* Sub-headline */}
            <p
              className={`text-base text-slate-500 leading-relaxed mb-8 max-w-xl transition-all duration-700 delay-300 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Forecast bulk freight rates, optimize charter timing, and evaluate charterer reliability — all in one platform built for procurement teams.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-wrap gap-3 transition-all duration-700 delay-[450ms] ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <button
                onClick={() => { resetForm(); setActiveTab('register'); setShowModal(true); }}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { resetForm(); setActiveTab('login'); setShowModal(true); }}
                className="btn-secondary flex items-center gap-2 px-6 py-2.5 text-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Dashboard
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div
            className={`mt-12 grid grid-cols-3 gap-4 max-w-lg transition-all duration-700 delay-[600ms] ${
              heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="card card-hover p-4 flex items-center gap-3"
              >
                <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.borderColor} border`}>
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-lg leading-none font-mono">{stat.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES SECTION */}
      {/* ============================================================ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          {/* Section header */}
          <div className="mb-10">
            <p className="text-teal-600 text-xs font-semibold tracking-widest uppercase mb-2">Platform Capabilities</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Everything You Need to Make Smarter Decisions
            </h3>
            <p className="text-slate-500 max-w-lg text-sm">
              From real-time market analytics to data-driven recommendations — FreightCast gives procurement teams a decisive edge.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="card card-hover p-6"
              >
                {/* Icon */}
                <div className={`inline-flex p-2.5 rounded-xl ${feature.bgColor} ${feature.borderColor} border mb-5`}>
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <h4 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{feature.desc}</p>

                {/* Expanded detail */}
                {expandedFeature === i && (
                  <p className="text-slate-500 text-sm leading-relaxed mb-4 border-t border-slate-100 pt-4">
                    {feature.detail}
                  </p>
                )}

                {/* Learn more toggle */}
                <button
                  onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
                  className="flex items-center gap-1 text-teal-600 text-sm font-medium hover:text-teal-700 transition-colors"
                >
                  {expandedFeature === i ? 'Show less' : 'Learn more'}
                  {expandedFeature === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA SECTION */}
      {/* ============================================================ */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="card p-10 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Ready to Optimize Your Freight Strategy?
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm">
              Join procurement teams leveraging data-driven insights to save on bulk cargo chartering.
            </p>
            <button
              onClick={() => { resetForm(); setActiveTab('register'); setShowModal(true); }}
              className="btn-primary inline-flex items-center gap-2 px-7 py-3 text-sm"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer className="border-t border-slate-200/80 py-8">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-teal-600" />
            <span className="text-slate-400 text-sm">FreightCast © 2026. Intelligent Freight Forecasting.</span>
          </div>
          <p className="text-slate-400 text-xs">SIH 2026 — Problem Statement 26006</p>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* LOGIN / REGISTER MODAL */}
      {/* ============================================================ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />

          {/* Modal Card */}
          <div
            className="relative w-full max-w-md animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
              {/* Header */}
              <div className="relative px-8 pt-8 pb-4">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-1.5 bg-teal-600 rounded-lg">
                    <Ship className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-lg">FreightCast</h3>
                    <p className="text-slate-400 text-xs">
                      {activeTab === 'login' ? 'Sign in to your account' : 'Create a new account'}
                    </p>
                  </div>
                </div>

                {/* Tab Toggle */}
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => handleTabSwitch('login')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'login'
                        ? 'bg-white text-teal-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                  <button
                    onClick={() => handleTabSwitch('register')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'register'
                        ? 'bg-white text-teal-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Register
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4">
                {/* Registration Success */}
                {registerSuccess && (
                  <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-emerald-700 text-sm font-medium">Account created successfully!</p>
                      <p className="text-emerald-600/70 text-xs mt-1">You can now sign in with your credentials.</p>
                    </div>
                    <button type="button" onClick={() => { setRegisterSuccess(false); handleTabSwitch('login'); }} className="text-emerald-500 hover:text-emerald-700 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg mb-5 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-rose-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Username */}
                <div className="mb-4">
                  <label htmlFor="login-username" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                {/* Email (register only) */}
                {activeTab === 'register' && (
                  <div className="mb-4">
                    <label htmlFor="register-email" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                      Email <span className="text-slate-300">(optional)</span>
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field w-full"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                )}

                {/* Password */}
                <div className="mb-6">
                  <label htmlFor="login-password" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field w-full pr-12"
                      placeholder="Enter your password"
                      required
                      autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {activeTab === 'login' ? (
                        <>
                          <LogIn className="w-4 h-4" />
                          Sign In
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Create Account
                        </>
                      )}
                    </>
                  )}
                </button>

                {/* Switch prompt */}
                <p className="text-center text-slate-400 text-sm mt-5">
                  {activeTab === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button type="button" onClick={() => handleTabSwitch('register')} className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                        Register
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button type="button" onClick={() => handleTabSwitch('login')} className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                        Sign In
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
