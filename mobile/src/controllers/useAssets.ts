import { useCallback, useEffect, useState } from 'react';

import { ASSETS, type Asset, type AssetId } from '../models/config/assets';
import { errorMessage } from '../models/format';
import { getBitcoinBalance, getMainnetBitcoinBalance } from '../models/services/bitcoinService';
import { getEvmBalance } from '../models/services/ethereumService';
import { getMainnetSolanaBalance, getSolanaBalance } from '../models/services/solanaService';
import { loadWatchAddress } from '../models/services/walletStorage';
import { useAsync } from './useAsync';
import { useExternalSigner } from './useWallet';
import { useWalletStore } from './WalletStore';

const READ_ONLY_ASSET_IDS = ASSETS.filter((a) => a.readOnly).map((a) => a.id);

export type AssetBalance = {
  asset: Asset;
  address: string;
  /** Confirmed + pending, in sats / wei. Undefined when the network couldn't be reached. */
  balance?: bigint;
  /** Bitcoin only: incoming/outgoing amount still in the mempool. */
  pending?: bigint;
  error?: string;
};

/** An unreachable RPC (e.g. Hardhat not running) would otherwise hang for minutes. */
const BALANCE_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Network timeout')), BALANCE_TIMEOUT_MS)),
  ]);
}

async function loadBalance(asset: Asset, evmAddress: string, btcAddress: string, solAddress: string): Promise<AssetBalance> {
  const address = asset.kind === 'bitcoin' ? btcAddress : asset.kind === 'solana' ? solAddress : evmAddress;
  try {
    if (asset.kind === 'bitcoin') {
      const { confirmed, unconfirmed } = await withTimeout(getBitcoinBalance(address));
      return { asset, address, balance: confirmed + unconfirmed, pending: unconfirmed };
    }
    if (asset.kind === 'solana') {
      return { asset, address, balance: await withTimeout(getSolanaBalance(address)) };
    }
    return { asset, address, balance: await withTimeout(getEvmBalance(address, asset.chain)) };
  } catch (e) {
    return { asset, address, error: errorMessage(e) };
  }
}

/** Mainnet ETH: balance of the connected external wallet, never the in-app key's address. */
async function loadMainnetEvmBalance(asset: Asset & { kind: 'evm' }, address?: string): Promise<AssetBalance> {
  if (!address) return { asset, address: '', error: 'Connect a wallet to view this balance' };
  try {
    return { asset, address, balance: await withTimeout(getEvmBalance(address, asset.chain)) };
  } catch (e) {
    return { asset, address, error: errorMessage(e) };
  }
}

/** Mainnet BTC: balance of a watched address — this app never holds a real BTC key. */
async function loadWatchedBitcoinBalance(asset: Asset, address?: string): Promise<AssetBalance> {
  if (!address) return { asset, address: '', error: 'Add an address to watch' };
  try {
    const { confirmed, unconfirmed } = await withTimeout(getMainnetBitcoinBalance(address));
    return { asset, address, balance: confirmed + unconfirmed, pending: unconfirmed };
  } catch (e) {
    return { asset, address, error: errorMessage(e) };
  }
}

/** Mainnet SOL: balance of a watched address — this app never holds a real Solana key. */
async function loadWatchedSolanaBalance(asset: Asset, address?: string): Promise<AssetBalance> {
  if (!address) return { asset, address: '', error: 'Add an address to watch' };
  try {
    return { asset, address, balance: await withTimeout(getMainnetSolanaBalance(address)) };
  } catch (e) {
    return { asset, address, error: errorMessage(e) };
  }
}

async function loadAllWatchAddresses(): Promise<Record<string, string | undefined>> {
  const entries = await Promise.all(READ_ONLY_ASSET_IDS.map(async (id) => [id, await loadWatchAddress(id)] as const));
  return Object.fromEntries(entries);
}

/** Balances of every coin for the active wallet. Each coin loads independently. */
export function useAssets() {
  const { active } = useWalletStore();
  const evm = active?.keys.address;
  const btc = active?.btcAddress;
  const sol = active?.solAddress;
  const external = useExternalSigner();
  const [watchAddresses, setWatchAddresses] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    loadAllWatchAddresses().then(setWatchAddresses);
  }, []);

  const load = useCallback(
    () =>
      Promise.all(
        ASSETS.map((asset) => {
          if (asset.kind === 'evm' && asset.mainnet) return loadMainnetEvmBalance(asset, external.address);
          if (asset.kind === 'bitcoin' && asset.readOnly) return loadWatchedBitcoinBalance(asset, watchAddresses[asset.id]);
          if (asset.kind === 'solana' && asset.readOnly) return loadWatchedSolanaBalance(asset, watchAddresses[asset.id]);
          return loadBalance(asset, evm!, btc!, sol!);
        }),
      ),
    [evm, btc, sol, external.address, watchAddresses],
  );
  const { data, loading, refresh } = useAsync(evm && btc && sol ? load : undefined);

  const byId = (id: AssetId) => data?.find((b) => b.asset.id === id);
  return {
    balances: data,
    byId,
    loading,
    refresh,
    watchAddresses,
    refreshWatchAddress: () => loadAllWatchAddresses().then(setWatchAddresses),
  };
}
