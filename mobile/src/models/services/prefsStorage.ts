import AsyncStorage from '@react-native-async-storage/async-storage';

// App preferences and the address book. Not secret, so plain AsyncStorage.

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR';
export const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'INR', label: 'Indian Rupee' },
];

/** Minutes of inactivity in the background before the wallet locks itself. -1 = never. */
export const AUTO_LOCK_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 0, label: 'Immediately' },
  { minutes: 1, label: 'After 1 minute' },
  { minutes: 5, label: 'After 5 minutes' },
  { minutes: 15, label: 'After 15 minutes' },
  { minutes: -1, label: 'Never' },
];

export type Prefs = {
  currency: CurrencyCode;
  notifications: boolean;
  biometric: boolean;
  autoLockMinutes: number;
};

export const DEFAULT_PREFS: Prefs = { currency: 'USD', notifications: false, biometric: false, autoLockMinutes: 5 };

const PREFS_KEY = 'prefs.v1';
const CONTACTS_KEY = 'addressBook.v1';

export async function loadPrefs(): Promise<Prefs> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: Prefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ---- address book ------------------------------------------------------------------------

export type ContactKind = 'evm' | 'bitcoin' | 'solana';
export type Contact = { id: string; name: string; address: string; kind: ContactKind };

export async function loadContacts(): Promise<Contact[]> {
  const raw = await AsyncStorage.getItem(CONTACTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Contact[];
  } catch {
    return [];
  }
}

export async function saveContacts(contacts: Contact[]) {
  await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}
