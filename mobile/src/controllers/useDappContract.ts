import { parseEther } from 'ethers';
import { useCallback, useMemo } from 'react';

import { getDappContract, getDappContractAddress, readContractState } from '../models/contracts';
import { useAsync } from './useAsync';
import { useTransaction } from './useTransaction';
import { useWallet } from './useWallet';

/**
 * Controller for DappContract: loads on-chain state for the connected account and
 * exposes validated write actions. Each action resolves to true when the tx confirmed.
 */
export function useDappContract() {
  const { address, chainId, network, readProvider } = useWallet();
  const contractAddress = getDappContractAddress(chainId);
  const { run, pending, status, setStatus, explorerUrl } = useTransaction();
  const symbol = network?.nativeCurrency.symbol ?? 'ETH';

  const reader = useMemo(
    () => (contractAddress && readProvider ? getDappContract(contractAddress, readProvider) : undefined),
    [contractAddress, readProvider],
  );

  const load = useCallback(() => readContractState(reader!, address!), [reader, address]);
  const { data: state, loading, error: readError, refresh } = useAsync(reader && address ? load : undefined);

  const write = useCallback(
    async (fn: string, args: unknown[] = [], value?: bigint) => {
      if (!contractAddress) return false;
      const receipt = await run(async (signer) => {
        const contract = getDappContract(contractAddress, signer);
        return contract[fn](...args, value !== undefined ? { value } : {});
      });
      if (receipt) refresh();
      return !!receipt;
    },
    [contractAddress, run, refresh],
  );

  const parseAmount = useCallback(
    (input: string) => {
      try {
        const value = parseEther(input.trim());
        if (value > 0n) return value;
      } catch {
        // fall through
      }
      setStatus({ kind: 'error', text: `Enter a positive amount in ${symbol}` });
      return undefined;
    },
    [setStatus, symbol],
  );

  const setMessage = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setStatus({ kind: 'error', text: 'Message cannot be empty' });
        return Promise.resolve(false);
      }
      return write('setMessage', [text.trim()]);
    },
    [write, setStatus],
  );

  const increment = useCallback(() => write('increment'), [write]);

  const deposit = useCallback(
    (amount: string) => {
      const value = parseAmount(amount);
      return value ? write('deposit', [], value) : Promise.resolve(false);
    },
    [parseAmount, write],
  );

  const withdraw = useCallback(
    (amount: string) => {
      const value = parseAmount(amount);
      return value ? write('withdraw', [value]) : Promise.resolve(false);
    },
    [parseAmount, write],
  );

  return {
    contractAddress,
    chainId,
    network,
    symbol,
    state,
    loading,
    readError,
    refresh,
    pending,
    status,
    explorerUrl,
    setMessage,
    increment,
    deposit,
    withdraw,
  };
}
