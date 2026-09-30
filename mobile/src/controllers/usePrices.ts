import { formatUnits } from 'ethers';
import { useCallback } from 'react';

import { getAsset, type AssetId } from '../models/config/assets';
import {
  fetchCryptoPrices,
  type MarketPrices,
} from '../models/services/blockchainComApi';
import type { AssetBalance } from './useAssets';
import { useAsync } from './useAsync';

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const decimalsFor = (kind: 'bitcoin' | 'evm' | 'solana') => (kind === 'bitcoin' ? 8 : kind === 'solana' ? 9 : 18);
const priceFor = (prices: MarketPrices, kind: 'bitcoin' | 'evm' | 'solana') =>
  kind === 'bitcoin' ? prices.btc : kind === 'solana' ? prices.sol : prices.eth;

/**
 * Controller hook providing real-time market prices from Blockchain.com
 * and computing USD valuations for wallet balances.
 */
export function usePrices() {
  const load = useCallback(() => fetchCryptoPrices(), []);
  const { data: prices, loading, error, refresh } = useAsync<MarketPrices>(load);

  const getCoinPrice = useCallback(
    (assetId: AssetId) => {
      if (!prices) return undefined;
      const kind = getAsset(assetId)?.kind ?? 'evm';
      const p = priceFor(prices, kind);
      return { price: p.price, change24h: p.change24hPercent };
    },
    [prices],
  );

  const getFiatValue = useCallback(
    (assetId: AssetId, balanceBigInt?: bigint): string => {
      if (balanceBigInt === undefined || !prices) return '$0.00';
      try {
        const kind = getAsset(assetId)?.kind ?? 'evm';
        const float = parseFloat(formatUnits(balanceBigInt, decimalsFor(kind)));
        return formatUsd(float * priceFor(prices, kind).price);
      } catch {
        return '$0.00';
      }
    },
    [prices],
  );

  const getTotalFiatValue = useCallback(
    (balances?: AssetBalance[]): string => {
      if (!balances || !prices) return '$0.00';

      let total = 0;
      for (const b of balances) {
        if (b.balance === undefined) continue;
        try {
          const float = parseFloat(formatUnits(b.balance, decimalsFor(b.asset.kind)));
          total += float * priceFor(prices, b.asset.kind).price;
        } catch {
          // ignore parsing error
        }
      }

      return formatUsd(total);
    },
    [prices],
  );

  return {
    prices,
    loading,
    error,
    refresh,
    getCoinPrice,
    getFiatValue,
    getTotalFiatValue,
  };
}
