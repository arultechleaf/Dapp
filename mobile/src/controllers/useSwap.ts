import { Contract, formatUnits, parseUnits } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { mainnet } from '../models/config/networks';
import { errorMessage } from '../models/format';
import { getProvider } from '../models/services/ethereumService';
import {
  buildSwapTx,
  getSwapQuote,
  NATIVE_TOKEN,
  SWAP_CHAIN_ID,
  SWAP_TOKENS,
  type SwapQuote,
  type SwapToken,
} from '../models/services/swapService';
import { useExternalSigner } from './useWallet';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

const QUOTE_REFRESH_MS = 15_000;

export type SwapStep = 'idle' | 'approving' | 'swapping' | 'done';
export const SLIPPAGE_OPTIONS = [0.5, 1, 2];

type Keyed<T> = { key: string; value?: T; error?: string };

/** Quote, balance and execution for an Ethereum mainnet swap signed by the connected external wallet. */
export function useSwap() {
  const external = useExternalSigner();
  const [from, setFrom] = useState<SwapToken>(SWAP_TOKENS[0]);
  const [to, setTo] = useState<SwapToken>(SWAP_TOKENS[1]);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [tick, setTick] = useState(0);
  const [quoteState, setQuoteState] = useState<Keyed<SwapQuote>>();
  const [balanceState, setBalanceState] = useState<Keyed<bigint>>();
  const [step, setStep] = useState<SwapStep>('idle');
  const [error, setError] = useState<string>();
  const [hash, setHash] = useState<string>();

  const user = external.address;
  const onMainnet = external.network?.id === SWAP_CHAIN_ID;

  const amountIn = useMemo(() => {
    try {
      const v = parseUnits(amount || '0', from.decimals);
      return v > 0n ? v : undefined;
    } catch {
      return undefined;
    }
  }, [amount, from.decimals]);

  const quoteKey = `${from.symbol}>${to.symbol}:${amountIn}:${tick}`;
  useEffect(() => {
    if (!amountIn || from.symbol === to.symbol) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getSwapQuote(from, to, amountIn).then(
        (value) => !cancelled && setQuoteState({ key: quoteKey, value }),
        (e) => !cancelled && setQuoteState({ key: quoteKey, error: errorMessage(e) }),
      );
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [quoteKey, amountIn, from, to]);

  // Keep the quote fresh while the user is on the screen.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), QUOTE_REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const balanceKey = `${user}:${from.symbol}:${step}`;
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const provider = getProvider(mainnet);
    const read =
      from.address === NATIVE_TOKEN
        ? provider.getBalance(user)
        : (new Contract(from.address, ERC20_ABI, provider).balanceOf(user) as Promise<bigint>);
    read.then(
      (value) => !cancelled && setBalanceState({ key: balanceKey, value }),
      (e) => !cancelled && setBalanceState({ key: balanceKey, error: errorMessage(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [balanceKey, user, from]);

  const quote = quoteState?.key === quoteKey ? quoteState.value : undefined;
  const quoteError = quoteState?.key === quoteKey ? quoteState.error : undefined;
  const balance = balanceState?.key === balanceKey ? balanceState.value : undefined;
  const receive = quote ? formatUnits(quote.destAmount, to.decimals) : undefined;
  const insufficient = balance !== undefined && amountIn !== undefined && amountIn > balance;

  const flip = useCallback(() => {
    setFrom(to);
    setTo(from);
    setAmount('');
  }, [from, to]);

  const swap = useCallback(async () => {
    if (!quote || !amountIn || !user) return;
    setError(undefined);
    setHash(undefined);
    try {
      const signer = await external.getSigner();
      if (from.address !== NATIVE_TOKEN) {
        const token = new Contract(from.address, ERC20_ABI, signer);
        const spender = quote.route.tokenTransferProxy;
        const allowance = (await token.allowance(user, spender)) as bigint;
        if (allowance < amountIn) {
          setStep('approving');
          // USDT reverts when raising a non-zero allowance directly.
          if (from.symbol === 'USDT' && allowance > 0n) await (await token.approve(spender, 0n)).wait();
          await (await token.approve(spender, amountIn)).wait();
        }
      }
      setStep('swapping');
      const built = await buildSwapTx({
        from,
        to,
        amount: amountIn,
        route: quote.route,
        userAddress: user,
        slippageBps: Math.round(slippage * 100),
      });
      const tx = await signer.sendTransaction({ to: built.to, data: built.data, value: built.value });
      setHash(tx.hash);
      await tx.wait();
      setStep('done');
      setAmount('');
    } catch (e) {
      setError(errorMessage(e));
      setStep('idle');
    }
  }, [quote, amountIn, user, external, from, to, slippage]);

  return {
    external,
    onMainnet,
    from,
    to,
    setFrom,
    setTo,
    amount,
    setAmount,
    slippage,
    setSlippage,
    quote,
    quoteError,
    receive,
    balance,
    insufficient,
    flip,
    swap,
    step,
    error,
    hash,
    busy: step === 'approving' || step === 'swapping',
    canSwap: !!quote && !!amountIn && onMainnet && !insufficient && from.symbol !== to.symbol,
  };
}
