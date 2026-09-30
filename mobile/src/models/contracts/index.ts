import { Contract, isAddress, type ContractRunner } from 'ethers';

import { MAINNET_CONTRACT_ADDRESS, SEPOLIA_CONTRACT_ADDRESS } from '../config/env';
import { mainnet, sepolia } from '../config/networks';
import type { ContractState, ContractTransaction } from '../types';
import abi from './DappContract.abi.json';
import addresses from './addresses.json';

// Both JSON files are written by `npm run deploy:*` in /contracts.
export const DAPP_CONTRACT_ABI = abi;

export function getDappContractAddress(chainId?: string | number): string | undefined {
  if (chainId === undefined) return undefined;
  // A contract deployed from Remix is configured via .env and wins over addresses.json.
  if (String(chainId) === String(sepolia.id) && isAddress(SEPOLIA_CONTRACT_ADDRESS)) {
    return SEPOLIA_CONTRACT_ADDRESS;
  }
  if (String(chainId) === String(mainnet.id) && isAddress(MAINNET_CONTRACT_ADDRESS)) {
    return MAINNET_CONTRACT_ADDRESS;
  }
  return (addresses as Record<string, string>)[String(chainId)];
}

export function getDappContract(address: string, runner: ContractRunner) {
  return new Contract(address, DAPP_CONTRACT_ABI, runner);
}

/** Reads the contract's public state plus `account`'s summary and history in one go. */
export async function readContractState(contract: Contract, account: string): Promise<ContractState> {
  const [message, counter, totalDeposits, summary, history] = await Promise.all([
    contract.message() as Promise<string>,
    contract.counter() as Promise<bigint>,
    contract.totalDeposits() as Promise<bigint>,
    contract.getAccountSummary(account),
    contract.getTransactions(account),
  ]);
  return {
    message,
    counter,
    totalDeposits,
    summary: {
      balance: summary.balance,
      deposited: summary.deposited,
      withdrawn: summary.withdrawn,
      transactions: summary.transactions,
    },
    history: (history as ContractTransaction[])
      .map((tx) => ({
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber,
        transactionType: tx.transactionType,
      }))
      .reverse(),
  };
}
