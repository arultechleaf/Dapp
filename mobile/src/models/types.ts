/** UI-agnostic status message produced by controllers and rendered by views. */
export type Status = { kind: 'success' | 'error' | 'info'; text: string } | undefined;

/** One entry of DappContract.getTransactions(account). */
export type ContractTransaction = {
  from: string;
  to: string;
  amount: bigint;
  timestamp: bigint;
  blockNumber: bigint;
  transactionType: string;
};

export type AccountSummary = {
  balance: bigint;
  deposited: bigint;
  withdrawn: bigint;
  transactions: bigint;
};

/** Everything the Contract Functions screen reads from the chain. */
export type ContractState = {
  message: string;
  counter: bigint;
  totalDeposits: bigint;
  summary: AccountSummary;
  /** Newest first. */
  history: ContractTransaction[];
};
