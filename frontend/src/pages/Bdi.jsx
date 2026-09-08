import { Activity } from 'lucide-react';
import MarketPricePage from '../components/MarketPricePage';
import { getBdiLatest, getBdiHistory } from '../api/freightService';

export default function Bdi() {
  return (
    <MarketPricePage
      title="Baltic Dry Index"
      subtitle="Daily BDI values · index points"
      unit="points"
      decimals={0}
      accent="teal"
      icon={Activity}
      fetchLatest={getBdiLatest}
      fetchHistory={getBdiHistory}
    />
  );
}
