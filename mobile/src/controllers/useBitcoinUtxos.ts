import { useCallback } from 'react';

import { getBitcoinUtxos } from '../models/services/bitcoinService';
import { useAsync } from './useAsync';
import { useWalletStore } from './WalletStore';

/** Unspent outputs (UTXOs) of the active wallet's Bitcoin address. */
export function useBitcoinUtxos(enabled = true) {
  const { active } = useWalletStore();
  const address = active?.btcAddress;
  const load = useCallback(() => getBitcoinUtxos(address!), [address]);
  const { data, loading, error, refresh } = useAsync(enabled && address ? load : undefined);
  return { utxos: data, loading, error, refresh };
}
