import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { usePrefs } from '../../controllers/PrefsStore';
import { useMarket } from '../../controllers/useMarket';
import { formatUsd } from '../../controllers/usePrices';
import { MARKET_COINS, type MarketCoinId } from '../../models/services/marketApi';
import { colors } from './ui';

const W = 110;
const H = 44;

/** Full-width market row: live price, 24h change and a sparkline. Tap it to open the full market page. */
export function MiniPriceChart({ coinId, onPress }: { coinId: MarketCoinId; onPress: () => void }) {
  usePrefs(); // re-render when the display currency changes
  const coin = MARKET_COINS.find((c) => c.id === coinId)!;
  const { chart, ticker } = useMarket(coinId, '24H');

  const { path, up } = useMemo(() => {
    if (!chart || chart.length < 2) return { path: undefined, up: true };
    const prices = chart.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const x = (i: number) => (i / (prices.length - 1)) * W;
    const y = (v: number) => 3 + (1 - (v - min) / Math.max(max - min, 1e-9)) * (H - 6);
    const d = prices.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return { path: d, up: prices[prices.length - 1] >= prices[0] };
  }, [chart]);

  const pct = ticker?.changePercent;
  const trend = (pct ?? (up ? 1 : -1)) >= 0 ? colors.success : colors.danger;

  return (
    <Pressable accessibilityLabel="Open market chart" onPress={onPress} style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{`${coin.symbol} price · 24h`}</Text>
        <Text style={s.price}>{ticker ? formatUsd(ticker.price) : '…'}</Text>
        <Text style={[s.pct, { color: trend }]}>
          {pct === undefined ? ' ' : `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`}
        </Text>
      </View>
      <View style={{ width: W, height: H }}>
        {path ? (
          <Svg width={W} height={H}>
            <Path d={path} stroke={trend} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </Svg>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: { color: colors.muted, fontSize: 12 },
  price: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  pct: { fontSize: 13, fontWeight: '700', marginTop: 1 },
});
