import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePrefs } from '../../controllers/PrefsStore';
import { useMarket } from '../../controllers/useMarket';
import { formatUsd } from '../../controllers/usePrices';
import {
  CHART_RANGES,
  MARKET_COINS,
  type ChartPoint,
  type ChartRange,
  type MarketCoinId,
} from '../../models/services/marketApi';
import { PriceChart } from './PriceChart';
import { Card, colors } from './ui';

const BADGES: Record<MarketCoinId, string> = { btc: '₿', eth: 'Ξ', sol: 'S' };

/** LIVE / 1H / 3H / 24H / 7D / 30D selector shared by the Market page and coin pages. */
export function RangeTabs({ range, onChange }: { range: ChartRange; onChange: (range: ChartRange) => void }) {
  return (
    <View style={s.ranges}>
      {(Object.keys(CHART_RANGES) as ChartRange[]).map((r) => (
        <Pressable key={r} onPress={() => onChange(r)} style={[s.range, range === r && s.rangeActive]}>
          <Text style={[s.rangeText, range === r && s.rangeTextActive]}>{r === 'LIVE' ? '● LIVE' : r}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Live price, range high / low, movement and an interactive chart for one coin. */
export function LiveMarketCard({ coinId, range }: { coinId: MarketCoinId; range: ChartRange }) {
  usePrefs(); // re-render when the display currency changes
  const coin = MARKET_COINS.find((c) => c.id === coinId)!;
  const { ticker, chart } = useMarket(coinId, range);
  const [inspected, setInspected] = useState<ChartPoint>();

  // Movement over the visible chart range, so it always matches the line on screen.
  const first = chart?.[0]?.price;
  const last = chart?.[chart.length - 1]?.price;
  const rangeChange = first && last ? last - first : undefined;
  const rangeChangePct = first && rangeChange !== undefined ? (rangeChange / first) * 100 : undefined;
  // High / low for the selected range, taken from the chart candles (fall back to the 24h ticker while loading).
  const rangeLabel = range === 'LIVE' ? 'Live' : range;
  const high = chart?.length ? Math.max(...chart.map((p) => p.high)) : ticker?.high;
  const low = chart?.length ? Math.min(...chart.map((p) => p.low)) : ticker?.low;
  const up = (rangeChange ?? ticker?.change ?? 0) >= 0;
  const trend = up ? colors.success : colors.danger;

  return (
    <Card>
      <View style={s.head}>
        <View style={[s.badge, { backgroundColor: coin.color }]}>
          <Text style={s.badgeText}>{BADGES[coin.id]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{coin.name}</Text>
          <Text style={s.symbol}>{coin.symbol} / USD</Text>
        </View>
        {ticker ? (
          <View style={[s.pill, { backgroundColor: `${trend}22` }]}>
            <Ionicons name={up ? 'trending-up' : 'trending-down'} size={14} color={trend} />
            <Text style={[s.pillText, { color: trend }]}>
              {up ? '+' : ''}
              {(rangeChangePct ?? ticker.changePercent).toFixed(2)}%
            </Text>
          </View>
        ) : null}
      </View>

      {ticker ? (
        <View style={s.hl}>
          <Text style={s.hlText}>
            <Text style={s.hlLabel}>{rangeLabel} High </Text>
            <Text style={{ color: colors.success }}>{high !== undefined ? formatUsd(high) : '-'}</Text>
          </Text>
          <Text style={s.hlText}>
            <Text style={s.hlLabel}>{rangeLabel} Low </Text>
            <Text style={{ color: colors.danger }}>{low !== undefined ? formatUsd(low) : '-'}</Text>
          </Text>
        </View>
      ) : null}

      {ticker ? (
        <>
          <Text style={s.price}>{formatUsd(inspected?.price ?? ticker.price)}</Text>
          <Text style={[s.move, { color: trend }]}>
            {rangeChange !== undefined
              ? `${up ? '+' : '-'}${formatUsd(Math.abs(rangeChange))} ${range === 'LIVE' ? 'last 2 min' : `past ${range}`}`
              : ' '}
          </Text>
        </>
      ) : (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 18 }} />
      )}

      <View style={{ marginVertical: 8 }}>
        {chart ? (
          <PriceChart points={chart} color={coin.color} onSelect={setInspected} />
        ) : (
          <View style={s.chartLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </View>

      {ticker ? (
        <View style={s.stats}>
          <Stat label={`${rangeLabel} High`} value={high !== undefined ? formatUsd(high) : '-'} color={colors.success} />
          <Stat label={`${rangeLabel} Low`} value={low !== undefined ? formatUsd(low) : '-'} color={colors.danger} />
          <Stat
            label="24h Change"
            value={`${ticker.changePercent >= 0 ? '+' : ''}${ticker.changePercent.toFixed(2)}%`}
            color={ticker.changePercent >= 0 ? colors.success : colors.danger}
          />
        </View>
      ) : null}
    </Card>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  ranges: { flexDirection: 'row', gap: 8 },
  range: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  },
  rangeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  rangeTextActive: { color: '#fff' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  symbol: { color: colors.muted, fontSize: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontWeight: '700', fontSize: 13 },
  hl: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 12 },
  hlText: { fontSize: 13, fontWeight: '700' },
  hlLabel: { color: colors.muted, fontWeight: '500' },
  price: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 12 },
  move: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  chartLoading: { height: 200, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, gap: 2 },
  statLabel: { color: colors.muted, fontSize: 11 },
  statValue: { fontSize: 13, fontWeight: '700' },
});
