import { useCallback, useState } from 'react';

import type { Asset } from '../models/config/assets';
import { formatAssetAmount, isValidAssetAddress, parseAssetAmount } from '../models/assetAmounts';
import { errorMessage } from '../models/format';
import { getFeeRates, sendBitcoin, type FeeRates } from '../models/services/bitcoinService';
import { sendEvm } from '../models/services/ethereumService';
import { sendSolana } from '../models/services/solanaService';
import { recordActivity } from '../models/services/walletStorage';
import type { Status } from '../models/types';
import { useExternalSigner } from './useWallet';
import { useWalletStore } from './WalletStore';

export type FeeSpeed = keyof FeeRates;

/** Validated send for any coin: ETH on an EVM network (ethers.js) or tBTC (bitcoinjs). */
export function useSendAsset(asset: Asset | undefined) {
  const { active } = useWalletStore();
  const external = useExternalSigner();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>();
  const [txUrl, setTxUrl] = useState<string>();

  /** Checks input without sending; returns the parsed amount or undefined (and sets an error). */
  const validate = useCallback(
    (to: string, amount: string, balance?: bigint) => {
      if (!asset) return undefined;
      if (asset.readOnly) {
        setStatus({ kind: 'error', text: 'This coin is read-only — sending isn’t available yet.' });
        return undefined;
      }
      if (asset.mainnet && asset.kind === 'evm' && !external.isConnected) {
        setStatus({ kind: 'error', text: 'Connect an external wallet to send real ETH' });
        return undefined;
      }
      if (!isValidAssetAddress(asset, to)) {
        setStatus({
          kind: 'error',
          text:
            asset.kind === 'bitcoin'
              ? 'Enter a testnet address (tb1…)'
              : asset.kind === 'solana'
                ? 'Enter a valid Solana address'
                : 'Enter a valid 0x… address',
        });
        return undefined;
      }
      let value: bigint;
      try {
        value = parseAssetAmount(asset, amount);
      } catch (e) {
        setStatus({ kind: 'error', text: errorMessage(e) });
        return undefined;
      }
      if (value <= 0n) {
        setStatus({ kind: 'error', text: 'Amount must be greater than zero' });
        return undefined;
      }
      if (balance !== undefined && value > balance) {
        setStatus({ kind: 'error', text: `Not enough ${asset.symbol} (balance ${formatAssetAmount(asset, balance)})` });
        return undefined;
      }
      setStatus(undefined);
      return value;
    },
    [asset, external.isConnected],
  );

  const send = useCallback(
    async (to: string, amount: bigint, speed: FeeSpeed = 'normal') => {
      if (!asset || !active) return false;
      if (asset.readOnly) {
        setStatus({ kind: 'error', text: 'This coin is read-only — sending isn’t available yet.' });
        return false;
      }
      if (asset.mainnet && asset.kind === 'evm' && !external.isConnected) {
        setStatus({ kind: 'error', text: 'Connect an external wallet to send real ETH' });
        return false;
      }
      setSending(true);
      setTxUrl(undefined);
      setStatus({
        kind: 'info',
        text: asset.mainnet ? 'Approve in your connected wallet…' : 'Signing and broadcasting…',
      });
      try {
        let hash: string;
        if (asset.kind === 'bitcoin') {
          const fees = await getFeeRates();
          ({ txid: hash } = await sendBitcoin({
            mnemonic: active.keys.mnemonic!,
            to,
            amountSats: amount,
            feeRate: fees[speed],
          }));
        } else if (asset.kind === 'solana') {
          // solana-mainnet is read-only (blocked above), so this only ever runs on devnet.
          ({ signature: hash } = await sendSolana({
            mnemonic: active.keys.mnemonic!,
            to: to.trim(),
            amountLamports: amount,
          }));
        } else if (asset.mainnet) {
          // Real funds: signs through the connected external wallet only, never the in-app key.
          const signer = await external.getSigner();
          const tx = await signer.sendTransaction({ to: to.trim(), value: amount });
          const receipt = await tx.wait(1, 120_000);
          if (!receipt || receipt.status !== 1) throw new Error('Transaction reverted');
          hash = tx.hash;
        } else {
          ({ hash } = await sendEvm({
            privateKey: active.keys.privateKey,
            network: asset.chain,
            to: to.trim(),
            amountWei: amount,
          }));
        }
        await recordActivity({
          walletId: active.id,
          asset: asset.id,
          hash,
          to: to.trim(),
          amount: formatAssetAmount(asset, amount, 8),
        });
        setTxUrl(asset.txUrl?.(hash));
        setStatus({
          kind: 'success',
          text:
            asset.kind === 'bitcoin' || asset.kind === 'solana'
              ? `Sent! ${hash.slice(0, 12)}… confirms shortly`
              : `Sent and confirmed: ${hash.slice(0, 12)}…`,
        });
        return true;
      } catch (e) {
        setStatus({ kind: 'error', text: errorMessage(e) });
        return false;
      } finally {
        setSending(false);
      }
    },
    [asset, active, external],
  );

  return { validate, send, sending, status, setStatus, txUrl };
}
