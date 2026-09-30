import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setDisplayCurrency } from '../models/format';
import {
  DEFAULT_PREFS,
  loadContacts,
  loadPrefs,
  saveContacts,
  savePrefs,
  type Contact,
  type Prefs,
} from '../models/services/prefsStorage';

type PrefsValue = {
  prefs: Prefs;
  loaded: boolean;
  update: (patch: Partial<Prefs>) => Promise<void>;
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
};

const PrefsContext = createContext<PrefsValue | undefined>(undefined);

/** Fiat exchange rate (USD → currency) from a public, keyless API. Falls back to 1 on failure. */
async function fetchRate(code: string): Promise<number> {
  if (code === 'USD') return 1;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const json = (await res.json()) as { rates?: Record<string, number> };
    return json.rates?.[code] ?? 1;
  } catch {
    return 1;
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadPrefs(), loadContacts()]).then(([p, c]) => {
      setPrefs(p);
      setContacts(c);
      setLoaded(true);
    });
  }, []);

  // Keep the shared currency formatter in step with the chosen currency.
  useEffect(() => {
    let cancelled = false;
    fetchRate(prefs.currency).then((rate) => {
      if (!cancelled) setDisplayCurrency(prefs.currency, rate);
      // setDisplayCurrency alone doesn't re-render consumers; bump state via a no-op prefs copy.
      if (!cancelled) setPrefs((p) => ({ ...p }));
    });
    return () => {
      cancelled = true;
    };
  }, [prefs.currency]);

  const update = useCallback(
    async (patch: Partial<Prefs>) => {
      const next = { ...prefs, ...patch };
      setPrefs(next);
      await savePrefs(next);
    },
    [prefs],
  );

  const addContact = useCallback(
    async (contact: Omit<Contact, 'id'>) => {
      const next = [{ ...contact, id: `${Date.now()}` }, ...contacts];
      setContacts(next);
      await saveContacts(next);
    },
    [contacts],
  );

  const removeContact = useCallback(
    async (id: string) => {
      const next = contacts.filter((c) => c.id !== id);
      setContacts(next);
      await saveContacts(next);
    },
    [contacts],
  );

  const value = useMemo(
    () => ({ prefs, loaded, update, contacts, addContact, removeContact }),
    [prefs, loaded, update, contacts, addContact, removeContact],
  );
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
