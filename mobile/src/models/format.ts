import { formatEther } from 'ethers';

export function shortAddress(address?: string, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatEth(wei: bigint, decimals = 4) {
  const [whole, fraction = ''] = formatEther(wei).split('.');
  const trimmed = fraction.slice(0, decimals).replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole;
}

/** Turns wallet / RPC / ethers errors into a single readable line. */
export function errorMessage(error: unknown): string {
  const e = error as {
    shortMessage?: string;
    reason?: string;
    info?: { error?: { message?: string } };
    message?: string;
    code?: string | number;
  };
  if (e?.code === 'ACTION_REJECTED' || e?.code === 4001) return 'Request rejected in wallet';
  return (
    e?.reason ??
    e?.shortMessage ??
    e?.info?.error?.message ??
    e?.message ??
    String(error)
  ).slice(0, 300);
}
//testing