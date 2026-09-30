import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from '../models/format';
import {
  fetchChart,
  fetchTicker24h,
  MARKET_COINS,
  openTickerStream,
  type ChartPoint,
  type ChartRange,
  type MarketCoinId,
  type Ticker24h,
} from '../models/services/marketApi';

const REFRESH_MS = 10_000;
/** Short ranges move every minute, so their charts refresh as often as the price. */
const CHART_REFRESH_MS: Record<ChartRange, number> = {
  LIVE: 0,
  '1H': 10_000,
  '3H': 10_000,
  '24H': 30_000,
  '7D': 60_000,
  '30D': 60_000,
};
/** The LIVE chart keeps a sliding window of the latest ticks. */
const LIVE_WINDOW = 120;

type Keyed<T> = { key: string; value?: T; error?: string };

/**
 * Price stats for one coin plus its chart for the selected range.
 * LIVE streams every second over a websocket; other ranges poll.
 */
export function useMarket(coinId: MarketCoinId, range: ChartRange) {
  const pair = MARKET_COINS.find((c) => c.id === coinId)!.pair;
  const live = range === 'LIVE';
  const [nonce, setNonce] = useState(0);
  const [tickerState, setTicker] = useState<Keyed<Ticker24h>>();
  const [chartState, setChart] = useState<Keyed<ChartPoint[]>>();

  const tickerKey = `${pair}:${nonce}`;
  const chartKey = `${pair}:${range}:${nonce}`;

  // Polled price (all ranges except LIVE, which gets it from the stream).
  useEffect(() => {
    if (live) return;
    let cancelled = false;
    const tick = () =>
      fetchTicker24h(pair).then(
        (value) => !cancelled && setTicker({ key: tickerKey, value }),
        (e) => !cancelled && setTicker((prev) => ({ key: tickerKey, value: prev?.value, error: errorMessage(e) })),
      );
    tick();
    const timer = setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pair, tickerKey, live]);

  // Chart history (LIVE loads once as a seed; the stream appends afterwards).
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchChart(pair, range).then(
        (value) => !cancelled && setChart({ key: chartKey, value }),
        (e) =>
          !cancelled &&
          setChart((prev) => ({ key: chartKey, value: prev?.key === chartKey ? prev.value : undefined, error: errorMessage(e) })),
      );
    load();
    if (live) {
      return () => {
        cancelled = true;
      };
    }
    const timer = setInterval(load, CHART_REFRESH_MS[range]);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pair, range, chartKey, live]);

  // Real-time stream for LIVE.
  useEffect(() => {
    if (!live) return;
    return openTickerStream(pair, (value, time) => {
      setTicker({ key: tickerKey, value });
      setChart((prev) => {
        if (prev?.key !== chartKey || !prev.value) return prev;
        const last = prev.value[prev.value.length - 1];
        if (last && time <= last.time) return prev;
        return { key: chartKey, value: [...prev.value, { time, price: value.price, high: value.price, low: value.price }].slice(-LIVE_WINDOW) };
      });
    });
  }, [pair, tickerKey, chartKey, live]);

  // Only expose data that belongs to the current coin/range.
  const ticker = tickerState?.value && tickerState.key.startsWith(`${pair}:`) ? tickerState.value : undefined;
  const chart = chartState?.key === chartKey ? chartState.value : undefined;
  const error =
    (tickerState?.key === tickerKey ? tickerState.error : undefined) ??
    (chartState?.key === chartKey ? chartState.error : undefined);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { ticker, chart, error, refresh, loading: !ticker || !chart };
}
