/**
 * Bitcoin TESTNET4. Test coins (tBTC) have no real value. Addresses start with "tb1".
 * Data and broadcasting go through the public mempool.space Esplora API.
 */
export const BITCOIN_TESTNET4 = {
  name: 'Bitcoin Testnet4',
  symbol: 'tBTC',
  apiUrl: 'https://mempool.space/testnet4/api',
  explorerUrl: 'https://mempool.space/testnet4',
  faucetUrl: 'https://mempool.space/testnet4/faucet',
  /** BIP84 native SegWit, testnet coin type 1, first receive address. */
  derivationPath: "m/84'/1'/0'/0/0",
} as const;

export function bitcoinTxUrl(txid: string) {
  return `${BITCOIN_TESTNET4.explorerUrl}/tx/${txid}`;
}

export function bitcoinAddressUrl(address: string) {
  return `${BITCOIN_TESTNET4.explorerUrl}/address/${address}`;
}

/**
 * Bitcoin MAINNET. Real BTC, real value. There's no wallet-signing path for this
 * in the app (no WalletConnect Bitcoin adapter available) — mainnet Bitcoin is
 * watch-only: balance and history for an address you already own elsewhere.
 */
export const BITCOIN_MAINNET = {
  name: 'Bitcoin',
  symbol: 'BTC',
  apiUrl: 'https://mempool.space/api',
  explorerUrl: 'https://mempool.space',
} as const;

export function bitcoinMainnetTxUrl(txid: string) {
  return `${BITCOIN_MAINNET.explorerUrl}/tx/${txid}`;
}

export function bitcoinMainnetAddressUrl(address: string) {
  return `${BITCOIN_MAINNET.explorerUrl}/address/${address}`;
}
