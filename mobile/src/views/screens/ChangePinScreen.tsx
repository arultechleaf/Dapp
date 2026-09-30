import { router } from 'expo-router';
import { useState } from 'react';

import { useWalletStore } from '../../controllers/WalletStore';
import { PinPad } from '../components/PinPad';

type Step = 'old' | 'new' | 'confirm';

/** Current PIN → new PIN → confirm new PIN. */
export default function ChangePinScreen() {
  const { verifyPin, changePin } = useWalletStore();
  const [step, setStep] = useState<Step>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = (message: string, back: Step) => {
    setError(message);
    setStep(back);
    setAttempt((a) => a + 1);
  };

  return (
    <PinPad
      title={step === 'old' ? 'Enter current PIN' : step === 'new' ? 'Enter new PIN' : 'Confirm new PIN'}
      error={error}
      busy={busy}
      resetKey={`${step}-${attempt}`}
      onComplete={async (pin) => {
        setError(undefined);
        if (step === 'old') {
          setBusy(true);
          const ok = await verifyPin(pin);
          setBusy(false);
          if (!ok) return retry('Wrong PIN', 'old');
          setOldPin(pin);
          setStep('new');
        } else if (step === 'new') {
          setNewPin(pin);
          setStep('confirm');
        } else {
          if (pin !== newPin) return retry("PINs didn't match — enter the new PIN again", 'new');
          setBusy(true);
          await changePin(oldPin, pin);
          setBusy(false);
          router.back();
        }
      }}
    />
  );
}
