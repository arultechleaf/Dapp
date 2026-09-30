import type { Signer, TransactionResponse } from 'ethers';
import { useCallback, useState } from 'react';

import type { Status } from '../models/types';
import { errorMessage } from '../models/format';
import { useWallet } from './useWallet';

/**
 * Wraps a wallet transaction: asks the wallet to sign, then waits for the receipt
 * on the network RPC and reports progress through `status`.
 */
export function useTransaction() {
  const { getSigner, readProvider, network, kind } = useWallet();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>();
  const [lastHash, setLastHash] = useState<string>();

  const run = useCallback(
    async (send: (signer: Signer) => Promise<TransactionResponse>) => {
      setPending(true);
      setLastHash(undefined);
      setStatus({
        kind: 'info',
        text: kind === 'inapp' ? 'Signing in-app…' : 'Approve the request in your wallet app…',
      });
      try {
        const signer = await getSigner();
        const tx = await send(signer);
        setLastHash(tx.hash);
        setStatus({ kind: 'info', text: `Submitted ${tx.hash.slice(0, 10)}… waiting for confirmation` });

        const waiter = readProvider ?? signer.provider;
        if (!waiter) throw new Error('No RPC provider to confirm the transaction');
        const receipt = await waiter.waitForTransaction(tx.hash, 1, 120_000);
        if (!receipt || receipt.status !== 1) throw new Error('Transaction reverted');
        setStatus({ kind: 'success', text: `Confirmed in block ${receipt.blockNumber}` });
        return receipt;
      } catch (e) {
        setStatus({ kind: 'error', text: errorMessage(e) });
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [getSigner, readProvider, kind],
  );

  const explorerUrl =
    lastHash && network?.blockExplorers ? `${network.blockExplorers.default.url}/tx/${lastHash}` : undefined;

  return { run, pending, status, setStatus, lastHash, explorerUrl };
}
