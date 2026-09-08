import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
 <BrowserRouter>
 <Routes>
 {/* Dashboard Pages */}
 <Route path="/" element={<Overview />} />
 <Route path="/voyages" element={<ActiveVoyages />} />
 <Route path="/ports" element={<PortStatus />} />
 <Route path="/fleet" element={<FleetReadiness />} />

 {/* Rate Trends Pages */}
 <Route path="/rates/forecast" element={<RateForecast />} />
 <Route path="/rates/breakdown" element={<RateBreakdown />} />
 <Route path="/rates/graph" element={<GraphDetails />} />
 <Route path="/rates/index-graph" element={<IndexGraph />} />
 <Route path="/rates/bdi" element={<Navigate to="/rates/index-graph?type=BDI" replace />} />
 <Route path="/rates/vlsfo" element={<Navigate to="/rates/index-graph?type=VLSFO" replace />} />

 {/* Recommendations Pages */}
 <Route path="/recommendations/picks" element={<TopRecommendations />} />
 <Route path="/recommendations/simulator" element={<ScenarioSimulator />} />

 {/* Charterers Page (kept intact for now) */}
 <Route path="/charterers" element={<Charterers />} />
 </Routes>
 </BrowserRouter>
 );
}

export default App;
