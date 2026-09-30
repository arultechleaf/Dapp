import axios, { AxiosError } from 'axios';

import { blockchainDataClient } from './blockchainDataApi';

// ---------------------------------------------------------------------------
// Blockchain.com API Client (Axios → Blockchain.com Exchange v3 Ticker API).
//
//   React Native App ──Axios──▶ https://api.blockchain.com/v3/exchange
//                                ├─ Real-time BTC-USD / ETH-USD / SOL-USD tickers
//                                ├─ 24h price changes & volumes
//                                └─ Fallback to https://blockchain.info/ticker
// ---------------------------------------------------------------------------

// eslint-disable-next-line import/no-named-as-default-member
export const blockchainComApi = axios.create({
  baseURL: 'https://api.blockchain.com/v3/exchange',
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
});

// Retry up to 2 times on transient failures (network blips, 5xx).
blockchainComApi.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryConfig | undefined;
  if (!config) return Promise.reject(error);
  const currentRetry = config.__retryCount ?? 0;
  const isRetryable = !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
  if (isRetryable && currentRetry < 2) {
    const nextRetry = currentRetry + 1;
    config.__retryCount = nextRetry;
    await new Promise((r) => setTimeout(r, nextRetry * 1000));
    return blockchainComApi.request(config);
  }
  if (error.response) {
    const data = error.response.data;
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    return Promise.reject(new Error(`Blockchain.com API ${error.response.status}: ${msg.slice(0, 150)}`));
  }
  if (error.code === 'ECONNABORTED') {
    return Promise.reject(new Error('Blockchain.com API request timed out'));
  }
  return Promise.reject(new Error(`Blockchain.com API error: ${error.message}`));
});

type RetryConfig = AxiosError['config'] & { __retryCount?: number };

export type BlockchainTicker = {
  symbol: string;
  price_24h: number;
  volume_24h: number;
  last_trade_price: number;
};

export type CryptoPriceData = {
  price: number;
  price24h: number;
  change24hPercent: number;
};

export type MarketPrices = {
  btc: CryptoPriceData;
  eth: CryptoPriceData;
  sol: CryptoPriceData;
  updatedAt: number;
};

/**
 * Fetch a single ticker from Blockchain.com Exchange v3 API.
 * e.g. 'BTC-USD' | 'ETH-USD' | 'SOL-USD'
 */
export async function fetchTicker(symbol: 'BTC-USD' | 'ETH-USD' | 'SOL-USD'): Promise<BlockchainTicker> {
  const { data } = await blockchainComApi.get<BlockchainTicker>(`/tickers/${symbol}`);
  return data;
}

/**
 * Fetch live market prices and 24h change for BTC, ETH and SOL in USD.
 * Primary source: Blockchain.com Exchange v3 API (all three coins).
 * Fallback: blockchain.info/ticker (BTC only) + CoinCap API (ETH, SOL).
 */
export async function fetchCryptoPrices(): Promise<MarketPrices> {
  try {
    const [btcRes, ethRes, solRes] = await Promise.all([
      fetchTicker('BTC-USD'),
      fetchTicker('ETH-USD'),
      fetchTicker('SOL-USD'),
    ]);

    const calcChange = (current: number, past24h: number): number => {
      if (!past24h || past24h === 0) return 0;
      return ((current - past24h) / past24h) * 100;
    };

    return {
      btc: {
        price: btcRes.last_trade_price,
        price24h: btcRes.price_24h,
        change24hPercent: calcChange(btcRes.last_trade_price, btcRes.price_24h),
      },
      eth: {
        price: ethRes.last_trade_price,
        price24h: ethRes.price_24h,
        change24hPercent: calcChange(ethRes.last_trade_price, ethRes.price_24h),
      },
      sol: {
        price: solRes.last_trade_price,
        price24h: solRes.price_24h,
        change24hPercent: calcChange(solRes.last_trade_price, solRes.price_24h),
      },
      updatedAt: Date.now(),
    };
  } catch {
    // Fallback: blockchain.info/ticker for BTC + CoinCap for ETH & SOL real prices.
    const [btcResult, ethSolResult] = await Promise.allSettled([
      blockchainDataClient.get<{ USD: { last: number } }>('/ticker'),
      axios.get<{ data: { priceUsd: string }[] }>('https://api.coincap.io/v2/assets', {
        params: { ids: 'ethereum,solana' },
        timeout: 10_000,
      }),
    ]);

    const btcPrice =
      btcResult.status === 'fulfilled' ? btcResult.value.data.USD.last : 0;

    let ethPrice = 0;
    let solPrice = 0;
    if (ethSolResult.status === 'fulfilled') {
      for (const asset of ethSolResult.value.data.data) {
        const p = parseFloat((asset as { id?: string; priceUsd: string }).priceUsd);
        if ((asset as { id?: string }).id === 'ethereum') ethPrice = p;
        if ((asset as { id?: string }).id === 'solana') solPrice = p;
      }
    }

    return {
      btc: { price: btcPrice, price24h: btcPrice, change24hPercent: 0 },
      eth: { price: ethPrice, price24h: ethPrice, change24hPercent: 0 },
      sol: { price: solPrice, price24h: solPrice, change24hPercent: 0 },
      updatedAt: Date.now(),
    };
  }
}
