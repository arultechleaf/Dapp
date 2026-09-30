import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useWalletStore } from '../../../controllers/WalletStore';
import { errorMessage } from '../../../models/format';
import { PinPad } from '../../components/PinPad';

/** Step 1 of onboarding: choose a 6-digit PIN, then enter it again to confirm. */
export default function PinSetupScreen() {
  const { next } = useLocalSearchParams<{ next?: 'create' | 'import' }>();
  const { setupPin } = useWalletStore();
  const [first, setFirst] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function onComplete(pin: string) {
    if (!first) {
      setFirst(pin);
      setError(undefined);
      setAttempt((a) => a + 1);
      return;
    }
    if (pin !== first) {
      setFirst(undefined);
      setError("PINs didn't match — try again");
      setAttempt((a) => a + 1);
      return;
    }
    setBusy(true);
    try {
      await setupPin(pin);
      router.replace({ pathname: '/onboarding/notifications', params: { next: next ?? 'create' } });
    } catch (e) {
      setError(errorMessage(e));
      setFirst(undefined);
      setAttempt((a) => a + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PinPad
      title={first ? 'Confirm your PIN' : 'Create a 6-digit PIN'}
      subtitle={
        first ? 'Enter the same PIN again.' : 'You will use this PIN to unlock the wallet and approve transactions.'
      }
      error={error}
      busy={busy}
      resetKey={attempt}
      onComplete={onComplete}
    />
  );
}
