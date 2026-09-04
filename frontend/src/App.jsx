import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Overview from './pages/Overview';
import ActiveVoyages from './pages/ActiveVoyages';
import PortStatus from './pages/PortStatus';
import FleetReadiness from './pages/FleetReadiness';
import RateForecast from './pages/RateForecast';
import RateBreakdown from './pages/RateBreakdown';
import TopRecommendations from './pages/TopRecommendations';
import ScenarioSimulator from './pages/ScenarioSimulator';
import Charterers from './pages/Charterers';

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
