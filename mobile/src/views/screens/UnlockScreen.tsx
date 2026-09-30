import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWalletStore } from '../../controllers/WalletStore';
import { PinPad } from '../components/PinPad';
import { colors } from '../components/ui';

/** Lock screen: enter the 6-digit PIN to open the wallet. */
export default function UnlockScreen() {
  const { unlock, resetAll } = useWalletStore();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  return (
    <SafeAreaView style={s.root}>
      <PinPad
        title="Enter your PIN"
        subtitle="Unlock Dapp New Wallet"
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
        <Pressable
          onPress={() =>
            Alert.alert(
              'Forgot PIN?',
              'Resetting removes all wallets from this phone. You can restore them later with their recovery phrases.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset wallet', style: 'destructive', onPress: () => resetAll() },
              ],
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
  footer: { alignItems: 'center', paddingBottom: 16 },
  forgot: { color: colors.primary, fontSize: 15, fontWeight: '600', padding: 8 },
});
