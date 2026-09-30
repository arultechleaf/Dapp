import { useCallback, useEffect, useState } from 'react';

import { ASSETS, getAsset, type Asset, type AssetId } from '../models/config/assets';
import { formatBtc, getBitcoinTransactions, getMainnetBitcoinTransactions } from '../models/services/bitcoinService';
import { formatSol, getMainnetSolanaTransactions, getSolanaTransactions, type SolanaTx } from '../models/services/solanaService';
import { loadActivity, loadWatchAddress } from '../models/services/walletStorage';
import { useAsync } from './useAsync';
import { useWalletStore } from './WalletStore';

export type HistoryItem = {
  key: string;
  asset: Asset;
  direction: 'in' | 'out';
  /** Display amount in the asset's unit, without sign. */
  //testing
  amount: string;
  counterparty?: string;
  /** Milliseconds; undefined while pending. */
  time?: number;
  pending: boolean;
  url?: string;
};

/**
 * Transaction history for the active wallet:
 * - Bitcoin: full on-chain history from mempool.space (sent + received).
 * - Ethereum networks: transactions sent from this app (public testnet RPCs don't index history).
 */
const EXCLUDED_FROM_ACTIVITY_LOG: AssetId[] = ['btc', 'btc-mainnet', 'sol', 'solana-mainnet'];

export function useHistory(filter?: AssetId) {
  const { active } = useWalletStore();
  const walletId = active?.id;
  const btcAddress = active?.btcAddress;
  const solAddress = active?.solAddress;
  const [watchAddresses, setWatchAddresses] = useState<{ btcMainnet?: string; solMainnet?: string }>({});

  useEffect(() => {
    Promise.all([loadWatchAddress('btc-mainnet'), loadWatchAddress('solana-mainnet')]).then(
      ([btcMainnet, solMainnet]) => setWatchAddresses({ btcMainnet, solMainnet }),
    );
  }, []);

  const load = useCallback(async (): Promise<HistoryItem[]> => {
    const btc = ASSETS.find((a) => a.id === 'btc')!;
    const btcMainnet = ASSETS.find((a) => a.id === 'btc-mainnet')!;
    const sol = ASSETS.find((a) => a.id === 'sol')!;
    const solMainnet = ASSETS.find((a) => a.id === 'solana-mainnet')!;
    const [activity, btcTxs, btcMainnetTxs, solTxs, solMainnetTxs] = await Promise.all([
      loadActivity(),
      !filter || filter === 'btc' ? getBitcoinTransactions(btcAddress!).catch(() => []) : Promise.resolve([]),
      (!filter || filter === 'btc-mainnet') && watchAddresses.btcMainnet
        ? getMainnetBitcoinTransactions(watchAddresses.btcMainnet).catch(() => [])
        : Promise.resolve([]),
      !filter || filter === 'sol' ? getSolanaTransactions(solAddress!).catch(() => []) : Promise.resolve([]),
      (!filter || filter === 'solana-mainnet') && watchAddresses.solMainnet
        ? getMainnetSolanaTransactions(watchAddresses.solMainnet).catch(() => [])
        : Promise.resolve([]),
    ]);

    const evmItems: HistoryItem[] = activity
      .filter(
        (a) => a.walletId === walletId && !EXCLUDED_FROM_ACTIVITY_LOG.includes(a.asset) && (!filter || a.asset === filter),
      )
      .map((a) => {
        const asset = getAsset(a.asset)!;
        return {
          key: `evm-${a.id}`,
          asset,
          direction: 'out',
          amount: a.amount,
          counterparty: a.to,
          time: a.time,
          pending: false,
          url: asset.txUrl?.(a.hash),
        };
      });

    const mapBtcTx = (asset: Asset) => (tx: (typeof btcTxs)[number]): HistoryItem => ({
      key: `${asset.id}-${tx.txid}`,
      asset,
      direction: tx.amount >= 0n ? 'in' : 'out',
      amount: formatBtc(tx.amount >= 0n ? tx.amount : -tx.amount),
      time: tx.time ? tx.time * 1000 : undefined,
      pending: !tx.confirmed,
      url: asset.txUrl?.(tx.txid),
    });

    const mapSolTx = (asset: Asset) => (tx: SolanaTx): HistoryItem => ({
      key: `${asset.id}-${tx.signature}`,
      asset,
      direction: tx.amount >= 0n ? 'in' : 'out',
      amount: formatSol(tx.amount >= 0n ? tx.amount : -tx.amount),
      time: tx.time ? tx.time * 1000 : undefined,
      pending: !tx.confirmed,
      url: asset.txUrl?.(tx.signature),
    });

    const btcItems: HistoryItem[] = btcTxs.map(mapBtcTx(btc));
    const btcMainnetItems: HistoryItem[] = btcMainnetTxs.map(mapBtcTx(btcMainnet));
    const solItems: HistoryItem[] = solTxs.map(mapSolTx(sol));
    const solMainnetItems: HistoryItem[] = solMainnetTxs.map(mapSolTx(solMainnet));

    // Pending first, then newest first.
    return [...evmItems, ...btcItems, ...btcMainnetItems, ...solItems, ...solMainnetItems].sort(
      (a, b) => (b.time ?? Infinity) - (a.time ?? Infinity),
    );
  }, [walletId, btcAddress, solAddress, watchAddresses, filter]);

  const { data, loading, error, refresh } = useAsync(walletId && btcAddress && solAddress ? load : undefined);
  return { items: data, loading, error, refresh };
}
