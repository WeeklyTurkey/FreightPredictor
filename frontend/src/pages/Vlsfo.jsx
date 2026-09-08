import { Fuel } from 'lucide-react';
import MarketPricePage from '../components/MarketPricePage';
import { getVlsfoLatest, getVlsfoHistory } from '../api/freightService';

export default function Vlsfo() {
  return (
    <MarketPricePage
      title="VLSFO Bunker Price"
      subtitle="Daily VLSFO prices · USD per metric ton"
      unit="$/MT"
      valuePrefix="$"
      valueSuffix="/MT"
      decimals={2}
      accent="blue"
      icon={Fuel}
      fetchLatest={getVlsfoLatest}
      fetchHistory={getVlsfoHistory}
    />
  );
}
