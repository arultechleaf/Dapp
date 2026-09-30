import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { getAsset } from '../../models/config/assets';
import type { ChartRange, MarketCoinId } from '../../models/services/marketApi';
import { LiveMarketCard, RangeTabs } from '../components/LiveMarketCard';
import { Muted, Screen } from '../components/ui';

/** Full market page for one coin: live price, range tabs, chart, high / low. */
export default function CoinMarketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = getAsset(id);
  const [range, setRange] = useState<ChartRange>('LIVE');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!asset) {
    return (
      <Screen>
        <Muted>Unknown coin.</Muted>
      </Screen>
    );
  }
  const coinId: MarketCoinId = asset.kind === 'bitcoin' ? 'btc' : asset.kind === 'solana' ? 'sol' : 'eth';

  return (
    <Screen refreshing={false} onRefresh={() => setRefreshKey((k) => k + 1)}>
      <Stack.Screen options={{ title: `${asset.name} market` }} />
      <RangeTabs range={range} onChange={setRange} />
      <LiveMarketCard key={refreshKey} coinId={coinId} range={range} />
      {!asset.mainnet ? (
        <Muted>{`${asset.symbol} is a test coin with no market value. The chart shows the real ${asset.name} price.`}</Muted>
      ) : null}
      <Muted>Live prices from Binance. Touch and drag the chart to inspect any point.</Muted>
    </Screen>
  );
}
