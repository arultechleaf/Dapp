import { useState } from 'react';

import type { ChartRange } from '../../models/services/marketApi';
import { LiveMarketCard, RangeTabs } from '../components/LiveMarketCard';
import { Muted, Screen } from '../components/ui';

/** Live BTC and ETH prices with interactive charts, range high/low and price movement. */
export default function MarketScreen() {
  const [range, setRange] = useState<ChartRange>('LIVE');
  // Bumping the key remounts the cards, which re-fetches everything (pull to refresh).
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Screen refreshing={false} onRefresh={() => setRefreshKey((k) => k + 1)}>
      <RangeTabs range={range} onChange={setRange} />
      <LiveMarketCard key={`btc-${refreshKey}`} coinId="btc" range={range} />
      <LiveMarketCard key={`eth-${refreshKey}`} coinId="eth" range={range} />
      <Muted>
        Live prices from Binance. LIVE streams every second; 1H / 3H update every 10 seconds. Touch and drag a chart to
        inspect any point.
      </Muted>
    </Screen>
  );
}
