import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePrefs } from '../../controllers/PrefsStore';
import { useWalletStore } from '../../controllers/WalletStore';
import { authenticateBiometric } from '../../models/services/biometrics';
import { Logo } from '../components/Logo';
import { PinPad } from '../components/PinPad';
import { confirmAction } from '../components/confirm';
import { colors } from '../components/ui';

/** Lock screen: enter the 6-digit PIN (or use biometrics, if enabled) to open the wallet. */
export default function UnlockScreen() {
  const { unlock, unlockVerified, resetAll } = useWalletStore();
  const { prefs, loaded } = usePrefs();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const unlockWithBiometrics = async () => {
    if (await authenticateBiometric('Unlock Coinstep Wallet')) unlockVerified();
  };

  // Offer the biometric prompt straight away when it is enabled.
  useEffect(() => {
    if (loaded && prefs.biometric) {
      authenticateBiometric('Unlock Coinstep Wallet').then((ok) => ok && unlockVerified());
    }
  }, [loaded, prefs.biometric, unlockVerified]);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.logo}>
        <Logo size={64} />
      </View>
      <PinPad
        title="Enter your PIN"
        subtitle="Unlock Coinstep Wallet"
        error={error}
        busy={busy}
        resetKey={attempt}
        onComplete={async (pin) => {
          setBusy(true);
          const ok = await unlock(pin);
          setBusy(false);
          if (!ok) {
            setError('Wrong PIN — try again');
            setAttempt((a) => a + 1);
          }
        }}
      />
      <View style={s.footer}>
        {prefs.biometric ? (
          <Pressable onPress={unlockWithBiometrics} style={s.bio}>
            <Ionicons name="finger-print" size={22} color={colors.primary} />
            <Text style={s.forgot}>Use biometrics</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() =>
            confirmAction(
              'Forgot PIN?',
              'Resetting removes all wallets from this phone. You can restore them later with their recovery phrases.',
              'Reset wallet',
              () => resetAll(),
            )
          }
        >
          <Text style={s.forgot}>Forgot PIN?</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  logo: { alignItems: 'center', paddingTop: 24 },
  footer: { alignItems: 'center', paddingBottom: 16, gap: 4 },
  bio: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  forgot: { color: colors.primary, fontSize: 15, fontWeight: '600', padding: 8 },
});
