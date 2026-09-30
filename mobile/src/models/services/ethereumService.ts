import type { AppKitNetwork } from '@reown/appkit-react-native';
import { JsonRpcProvider, Wallet } from 'ethers';

// ---------------------------------------------------------------------------
// ethers.js service for the in-app wallet. Use it on TESTNETS only (Sepolia,
// Hardhat Local): keys created or imported here live in app memory, which is
// fine for test coins but never for a real mainnet wallet.
// ---------------------------------------------------------------------------

export type WalletKeys = {
  address: string;
  privateKey: string;
  /** 12-word recovery phrase; null when imported from a raw private key. */
  mnemonic: string | null;
};

/** Generates a brand-new wallet: a 12-word recovery phrase + keypair. */
export function createWallet(): WalletKeys {
  const wallet = Wallet.createRandom();
  return { address: wallet.address, privateKey: wallet.privateKey, mnemonic: wallet.mnemonic!.phrase };
}

/** Rebuilds a wallet from a recovery phrase the user already has. */
export function importFromMnemonic(phrase: string): WalletKeys {
  const normalized = phrase.trim().toLowerCase().split(/\s+/).join(' ');
  const wallet = Wallet.fromPhrase(normalized);
  return { address: wallet.address, privateKey: wallet.privateKey, mnemonic: normalized };
}

/** Rebuilds a wallet from a raw private key the user already has. */
export function importFromPrivateKey(key: string): WalletKeys {
  const trimmed = key.trim();
  const wallet = new Wallet(trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`);
  return { address: wallet.address, privateKey: wallet.privateKey, mnemonic: null };
}

const providers = new Map<string, JsonRpcProvider>();

/** Creates a JsonRpcProvider with cacheTimeout -1. */
function createProvider(url: string, chainId: number): JsonRpcProvider {
  return new JsonRpcProvider(url, chainId, {
    staticNetwork: true,
    cacheTimeout: -1,
  });
}

/** One cached JSON-RPC provider per network (reads + tx confirmations). */
export function getProvider(network: AppKitNetwork): JsonRpcProvider {
  const key = String(network.id);
  let provider = providers.get(key);
  if (!provider) {
    const urls = network.rpcUrls.default.http;
    provider = createProvider(urls[0], Number(network.id));
    providers.set(key, provider);
  }
  return provider;
}

/** Native coin balance (wei) of `address` on `network`, with automatic fallback to secondary RPCs. */
export async function getEvmBalance(address: string, network: AppKitNetwork): Promise<bigint> {
  const urls = network.rpcUrls.default.http;
  let lastError: unknown;

  for (const url of urls) {
    try {
      const provider = createProvider(url, Number(network.id));
      const balance = await provider.getBalance(address);
      // Update cached provider to the working one
      providers.set(String(network.id), provider);
      return balance;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error(`Unable to fetch balance from any RPC for ${network.name}`);
}

/** Signer for an in-app wallet on the given network. */
export function getInAppSigner(privateKey: string, network: AppKitNetwork): Wallet {
  return new Wallet(privateKey, getProvider(network));
}

/** Signs and broadcasts a native-coin transfer, then waits for 1 confirmation. */
export async function sendEvm(params: {
  privateKey: string;
  network: AppKitNetwork;
  to: string;
  amountWei: bigint;
}): Promise<{ hash: string }> {
  const signer = getInAppSigner(params.privateKey, params.network);
  const tx = await signer.sendTransaction({ to: params.to, value: params.amountWei });
  const receipt = await tx.wait(1, 120_000);
  if (!receipt || receipt.status !== 1) throw new Error('Transaction reverted');
  return { hash: tx.hash };
}
