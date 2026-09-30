import AsyncStorage from '@react-native-async-storage/async-storage';
import { hexlify, pbkdf2, randomBytes, toUtf8Bytes } from 'ethers';

import type { AssetId } from '../config/assets';
import { deleteSecret, getSecret, setSecret } from './secureStorage';

// ---------------------------------------------------------------------------
// Persistence for the multi-wallet store.
//   AsyncStorage  : wallet names/order + active wallet id, activity log (not secret)
//   SecureStore   : each wallet's recovery phrase, PIN hash + salt (secret)
// ---------------------------------------------------------------------------

export type WalletMeta = { id: string; name: string; createdAt: number };
type WalletIndex = { wallets: WalletMeta[]; activeId?: string };

export type Activity = {
  id: string;
  walletId: string;
  asset: AssetId;
  hash: string;
  to: string;
  /** Amount as a display string in the asset's unit, e.g. "0.01". */
  amount: string;
  time: number;
};

const INDEX_KEY = 'wallets.index';
const ACTIVITY_KEY = 'wallets.activity';
const PIN_HASH_KEY = 'pin.hash';
const PIN_SALT_KEY = 'pin.salt';
const PIN_ITERATIONS = 5000;
const mnemonicKey = (id: string) => `wallet.${id}.mnemonic`;

// ---- wallets -------------------------------------------------------------------

export async function loadWalletIndex(): Promise<WalletIndex> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  return raw ? (JSON.parse(raw) as WalletIndex) : { wallets: [] };
}

async function saveWalletIndex(index: WalletIndex) {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export async function loadMnemonic(id: string): Promise<string | null> {
  return getSecret(mnemonicKey(id));
}

/** Stores a new wallet, makes it active, and returns its metadata. */
export async function addWallet(name: string, mnemonic: string): Promise<WalletMeta> {
  const index = await loadWalletIndex();
  const meta: WalletMeta = { id: hexlify(randomBytes(8)).slice(2), name, createdAt: Date.now() };
  await setSecret(mnemonicKey(meta.id), mnemonic);
  await saveWalletIndex({ wallets: [...index.wallets, meta], activeId: meta.id });
  return meta;
}

export async function setActiveWallet(id: string) {
  const index = await loadWalletIndex();
  await saveWalletIndex({ ...index, activeId: id });
}

export async function renameWallet(id: string, name: string) {
  const index = await loadWalletIndex();
  await saveWalletIndex({
    ...index,
    wallets: index.wallets.map((w) => (w.id === id ? { ...w, name } : w)),
  });
}

export async function removeWallet(id: string) {
  const index = await loadWalletIndex();
  const wallets = index.wallets.filter((w) => w.id !== id);
  await deleteSecret(mnemonicKey(id));
  await saveWalletIndex({
    wallets,
    activeId: index.activeId === id ? wallets[0]?.id : index.activeId,
  });
}

/** Removes every wallet, the PIN and the activity log. */
export async function resetEverything() {
  const index = await loadWalletIndex();
  await Promise.all(index.wallets.map((w) => deleteSecret(mnemonicKey(w.id))));
  await Promise.all([deleteSecret(PIN_HASH_KEY), deleteSecret(PIN_SALT_KEY)]);
  await AsyncStorage.multiRemove([INDEX_KEY, ACTIVITY_KEY]);
}

// ---- PIN -------------------------------------------------------------------------

function hashPin(pin: string, saltHex: string) {
  return pbkdf2(toUtf8Bytes(pin), saltHex, PIN_ITERATIONS, 32, 'sha256');
}

export async function hasPin() {
  return (await getSecret(PIN_HASH_KEY)) !== null;
}

export async function setPin(pin: string) {
  const salt = hexlify(randomBytes(16));
  await setSecret(PIN_SALT_KEY, salt);
  await setSecret(PIN_HASH_KEY, hashPin(pin, salt));
}

export async function verifyPin(pin: string) {
  const [hash, salt] = await Promise.all([getSecret(PIN_HASH_KEY), getSecret(PIN_SALT_KEY)]);
  if (!hash || !salt) return false;
  return hashPin(pin, salt) === hash;
}

// ---- activity log (transactions sent from this app) ------------------------------------

export async function loadActivity(): Promise<Activity[]> {
  const raw = await AsyncStorage.getItem(ACTIVITY_KEY);
  return raw ? (JSON.parse(raw) as Activity[]) : [];
}

export async function recordActivity(entry: Omit<Activity, 'id' | 'time'>) {
  const list = await loadActivity();
  const item: Activity = { ...entry, id: hexlify(randomBytes(6)).slice(2), time: Date.now() };
  // newest first, keep the log bounded
  await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify([item, ...list].slice(0, 200)));
  return item;
}

// ---- watch-only mainnet addresses, one per read-only asset (public data, not a secret) --

const watchAddressKey = (assetId: string) => `watch.${assetId}`;

export async function loadWatchAddress(assetId: string): Promise<string | undefined> {
  const value = await AsyncStorage.getItem(watchAddressKey(assetId));
  return value ?? undefined;
}

export async function saveWatchAddress(assetId: string, address: string) {
  await AsyncStorage.setItem(watchAddressKey(assetId), address);
}

export async function clearWatchAddress(assetId: string) {
  await AsyncStorage.removeItem(watchAddressKey(assetId));
}
