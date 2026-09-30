export const REOWN_PROJECT_ID = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID ?? '';

export const LOCAL_RPC_URL = process.env.EXPO_PUBLIC_LOCAL_RPC_URL || 'http://10.0.2.2:8545';

export const SEPOLIA_RPC_URL =
  process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

/** DappContract address on Sepolia, e.g. deployed from Remix. Overrides addresses.json for chain 11155111. */
export const SEPOLIA_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_SEPOLIA_CONTRACT_ADDRESS ?? '';

export const MAINNET_RPC_URL =
  process.env.EXPO_PUBLIC_MAINNET_RPC_URL || 'https://1rpc.io/eth';

/** DappContract address on Ethereum Mainnet, once deployed there. Overrides addresses.json for chain 1. */
export const MAINNET_CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_MAINNET_CONTRACT_ADDRESS ?? '';

export const SOLANA_DEVNET_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';

export const SOLANA_MAINNET_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';
