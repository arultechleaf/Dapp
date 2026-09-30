import { SOLANA_DEVNET_RPC_URL, SOLANA_MAINNET_RPC_URL } from './env';

/**
 * Solana Devnet. The key is derived from the same 12-word recovery phrase as the
 * in-app Bitcoin/Ethereum wallets (SLIP-0010 ed25519, m/44'/501'/0'/0'), so one
 * phrase backs up all three. Test coins only — never use a real wallet phrase.
 */
export const SOLANA_DEVNET = {
  name: 'Solana Devnet',
  symbol: 'SOL',
  rpcUrl: SOLANA_DEVNET_RPC_URL,
  explorerUrl: 'https://explorer.solana.com',
  explorerCluster: 'devnet',
  faucetUrl: 'https://faucet.solana.com',
  derivationPath: "m/44'/501'/0'/0'",
} as const;

export function solanaDevnetTxUrl(signature: string) {
  return `${SOLANA_DEVNET.explorerUrl}/tx/${signature}?cluster=${SOLANA_DEVNET.explorerCluster}`;
}

export function solanaDevnetAddressUrl(address: string) {
  return `${SOLANA_DEVNET.explorerUrl}/address/${address}?cluster=${SOLANA_DEVNET.explorerCluster}`;
}

/**
 * Solana MAINNET. Real SOL, real value. There's no wallet-signing path for this in
 * the app (no WalletConnect Solana adapter available) — mainnet Solana is
 * watch-only: balance and history for an address you already own elsewhere.
 */
export const SOLANA_MAINNET = {
  name: 'Solana',
  symbol: 'SOL',
  rpcUrl: SOLANA_MAINNET_RPC_URL,
  explorerUrl: 'https://explorer.solana.com',
} as const;

export function solanaMainnetTxUrl(signature: string) {
  return `${SOLANA_MAINNET.explorerUrl}/tx/${signature}`;
}

export function solanaMainnetAddressUrl(address: string) {
  return `${SOLANA_MAINNET.explorerUrl}/address/${address}`;
}
