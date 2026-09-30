import axios from 'axios';

// ParaSwap public API (no key): finds the best route across Ethereum DEXes and builds the swap
// transaction. Ethereum MAINNET only; the transaction is signed by the user's external wallet.

export const SWAP_CHAIN_ID = 1;
export const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export type SwapToken = { symbol: string; name: string; address: string; decimals: number; color: string };

export const SWAP_TOKENS: SwapToken[] = [
  { symbol: 'ETH', name: 'Ether', address: NATIVE_TOKEN, decimals: 18, color: '#627EEA' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, color: '#2775CA' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, color: '#26A17B' },
  { symbol: 'DAI', name: 'Dai', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, color: '#F5AC37' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, color: '#F7931A' },
];

// eslint-disable-next-line import/no-named-as-default-member
const api = axios.create({ baseURL: 'https://api.paraswap.io', timeout: 15_000 });

export type PriceRoute = {
  srcAmount: string;
  destAmount: string;
  /** Spender the user must approve before swapping an ERC-20. */
  tokenTransferProxy: string;
  gasCostUSD?: string;
  [key: string]: unknown;
};

export type SwapQuote = { route: PriceRoute; destAmount: bigint; gasCostUsd?: number };

function apiError(e: unknown): Error {
  const data = (e as { response?: { data?: { error?: string } } }).response?.data;
  return new Error(data?.error ?? (e as Error).message ?? 'Swap service error');
}

export async function getSwapQuote(from: SwapToken, to: SwapToken, amount: bigint): Promise<SwapQuote> {
  try {
    const { data } = await api.get('/prices', {
      params: {
        srcToken: from.address,
        destToken: to.address,
        srcDecimals: from.decimals,
        destDecimals: to.decimals,
        amount: amount.toString(),
        side: 'SELL',
        network: SWAP_CHAIN_ID,
      },
    });
    const route = data.priceRoute as PriceRoute;
    return { route, destAmount: BigInt(route.destAmount), gasCostUsd: route.gasCostUSD ? Number(route.gasCostUSD) : undefined };
  } catch (e) {
    throw apiError(e);
  }
}

export type SwapTx = { to: string; data: string; value: bigint };

/** Builds the swap transaction for the quoted route. `slippageBps`: 100 = 1%. */
export async function buildSwapTx(params: {
  from: SwapToken;
  to: SwapToken;
  amount: bigint;
  route: PriceRoute;
  userAddress: string;
  slippageBps: number;
}): Promise<SwapTx> {
  const { from, to, amount, route, userAddress, slippageBps } = params;
  try {
    const { data } = await api.post(`/transactions/${SWAP_CHAIN_ID}`, {
      srcToken: from.address,
      destToken: to.address,
      srcDecimals: from.decimals,
      destDecimals: to.decimals,
      srcAmount: amount.toString(),
      slippage: slippageBps,
      priceRoute: route,
      userAddress,
    }, { params: { ignoreChecks: true } });
    return { to: data.to, data: data.data, value: BigInt(data.value ?? '0') };
  } catch (e) {
    throw apiError(e);
  }
}
