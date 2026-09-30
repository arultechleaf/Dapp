import axios from 'axios';

// Binance public market-data mirror: no API key, CORS enabled, read-only.
// eslint-disable-next-line import/no-named-as-default-member
const market = axios.create({ baseURL: 'https://data-api.binance.vision/api/v3', timeout: 10_000 });

export type MarketCoinId = 'btc' | 'eth' | 'sol';
export type ChartRange = 'LIVE' | '1H' | '3H' | '24H' | '7D' | '30D';

export const MARKET_COINS: { id: MarketCoinId; name: string; symbol: string; pair: string; color: string }[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', pair: 'BTCUSDT', color: '#F7931A' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', pair: 'ETHUSDT', color: '#627EEA' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', pair: 'SOLUSDT', color: '#9945FF' },
];

export const CHART_RANGES: Record<ChartRange, { interval: string; limit: number }> = {
  LIVE: { interval: '1s', limit: 120 },
  '1H': { interval: '1m', limit: 60 },
  '3H': { interval: '1m', limit: 180 },
  '24H': { interval: '15m', limit: 96 },
  '7D': { interval: '1h', limit: 168 },
  '30D': { interval: '4h', limit: 180 },
};

export type Ticker24h = {
  price: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  volume: number;
};

/** price is the close; high/low are the extremes inside that candle. */
export type ChartPoint = { time: number; price: number; high: number; low: number };

export async function fetchTicker24h(pair: string): Promise<Ticker24h> {
  const { data } = await market.get('/ticker/24hr', { params: { symbol: pair } });
  return {
    price: Number(data.lastPrice),
    high: Number(data.highPrice),
    low: Number(data.lowPrice),
    change: Number(data.priceChange),
    changePercent: Number(data.priceChangePercent),
    volume: Number(data.quoteVolume),
  };
}

export async function fetchChart(pair: string, range: ChartRange): Promise<ChartPoint[]> {
  const { interval, limit } = CHART_RANGES[range];
  const { data } = await market.get<(string | number)[][]>('/klines', { params: { symbol: pair, interval, limit } });
  return data.map((k) => ({ time: Number(k[0]), price: Number(k[4]), high: Number(k[2]), low: Number(k[3]) }));
}

/**
 * Real-time ticker over Binance's websocket (one message per second): price plus 24h stats.
 * Reconnects automatically; returns a function that closes the stream.
 */
export function openTickerStream(pair: string, onTick: (ticker: Ticker24h, time: number) => void): () => void {
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const connect = () => {
    socket = new WebSocket(`wss://data-stream.binance.vision/ws/${pair.toLowerCase()}@ticker`);
    socket.onmessage = (event) => {
      try {
        const d = JSON.parse(String(event.data));
        onTick(
          {
            price: Number(d.c),
            high: Number(d.h),
            low: Number(d.l),
            change: Number(d.p),
            changePercent: Number(d.P),
            volume: Number(d.q),
          },
          Number(d.E),
        );
      } catch {
        // ignore malformed frames
      }
    };
    socket.onclose = () => {
      if (!closed) retry = setTimeout(connect, 3000);
    };
  };
  connect();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    socket?.close();
  };
}
