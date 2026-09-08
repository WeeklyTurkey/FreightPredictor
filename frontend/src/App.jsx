import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Overview from './pages/Overview';
import ActiveVoyages from './pages/ActiveVoyages';
import PortStatus from './pages/PortStatus';
import FleetReadiness from './pages/FleetReadiness';
import RateForecast from './pages/RateForecast';
import RateBreakdown from './pages/RateBreakdown';
import TopRecommendations from './pages/TopRecommendations';
import ScenarioSimulator from './pages/ScenarioSimulator';
import Charterers from './pages/Charterers';
import GraphDetails from './pages/GraphDetails';
import IndexGraph from './pages/IndexGraph';

function App() {
 return (
 <AuthProvider>
 <BrowserRouter>
 <Routes>
 {/* Public — Landing Page (redirects to /dashboard when logged in) */}
 <Route path="/" element={<LandingPage />} />

 {/* Protected — Dashboard Pages */}
 <Route path="/dashboard" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
 <Route path="/voyages" element={<ProtectedRoute><ActiveVoyages /></ProtectedRoute>} />
 <Route path="/ports" element={<ProtectedRoute><PortStatus /></ProtectedRoute>} />
 <Route path="/fleet" element={<ProtectedRoute><FleetReadiness /></ProtectedRoute>} />

 {/* Protected — Rate Trends Pages */}
 <Route path="/rates/forecast" element={<ProtectedRoute><RateForecast /></ProtectedRoute>} />
 <Route path="/rates/breakdown" element={<ProtectedRoute><RateBreakdown /></ProtectedRoute>} />
 <Route path="/rates/graph" element={<ProtectedRoute><GraphDetails /></ProtectedRoute>} />
 <Route path="/rates/index-graph" element={<ProtectedRoute><IndexGraph /></ProtectedRoute>} />
 <Route path="/rates/bdi" element={<Navigate to="/rates/index-graph?type=BDI" replace />} />
 <Route path="/rates/vlsfo" element={<Navigate to="/rates/index-graph?type=VLSFO" replace />} />

 {/* Protected — Recommendations Pages */}
 <Route path="/recommendations/picks" element={<ProtectedRoute><TopRecommendations /></ProtectedRoute>} />
 <Route path="/recommendations/simulator" element={<ProtectedRoute><ScenarioSimulator /></ProtectedRoute>} />

 {/* Protected — Charterers Page (kept intact for now) */}
 <Route path="/charterers" element={<ProtectedRoute><Charterers /></ProtectedRoute>} />
 </Routes>
 </BrowserRouter>
 </AuthProvider>
 );
}

export default App;
