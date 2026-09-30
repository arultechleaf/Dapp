import type { AssetId } from '../config/assets';

export type EvmTx = {
  hash: string;
  from: string;
  to?: string;
  /** Wei. */
  value: bigint;
  /** Unix seconds. */
  time?: number;
  confirmed: boolean;
  failed: boolean;
};

/** Public Blockscout explorers: full address history (sent + received), no API key. */
const BLOCKSCOUT: Partial<Record<AssetId, string>> = {
  sepolia: 'https://eth-sepolia.blockscout.com/api/v2',
  ethereum: 'https://eth.blockscout.com/api/v2',
};

type BlockscoutTx = {
  hash: string;
  from?: { hash: string };
  to?: { hash: string } | null;
  value?: string;
  timestamp?: string | null;
  status?: string | null;
  result?: string;
};

export async function getEvmTransactions(asset: AssetId, address: string): Promise<EvmTx[]> {
  const base = BLOCKSCOUT[asset];
  if (!base) return [];
  const res = await fetch(`${base}/addresses/${address}/transactions`);
  if (res.status === 404) return []; // address never seen on this chain
  if (!res.ok) throw new Error(`History request failed (${res.status})`);
  const json = (await res.json()) as { items?: BlockscoutTx[] };
  return (json.items ?? []).map((tx) => ({
    hash: tx.hash,
    from: tx.from?.hash ?? '',
    to: tx.to?.hash ?? undefined,
    value: BigInt(tx.value ?? '0'),
    time: tx.timestamp ? Math.floor(new Date(tx.timestamp).getTime() / 1000) : undefined,
    confirmed: tx.status === 'ok' || tx.status === 'error',
    failed: tx.status === 'error',
  }));
}
