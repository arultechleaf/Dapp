import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { usePrefs } from '../../controllers/PrefsStore';
import { useWalletStore } from '../../controllers/WalletStore';

/** Locks the wallet when the app comes back after being in the background longer than the chosen auto-lock time. */
export function AutoLock() {
  const { status, lock } = useWalletStore();
  const { prefs } = usePrefs();
  const leftAt = useRef<number | undefined>(undefined);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        leftAt.current ??= Date.now();
        return;
      }
      const away = leftAt.current ? Date.now() - leftAt.current : 0;
      leftAt.current = undefined;
      if (status === 'unlocked' && prefs.autoLockMinutes >= 0 && away >= prefs.autoLockMinutes * 60_000) lock();
    });
    return () => sub.remove();
  }, [status, prefs.autoLockMinutes, lock]);

  return null;
}
