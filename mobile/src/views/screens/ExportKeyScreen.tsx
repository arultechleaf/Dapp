import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useWalletStore } from '../../controllers/WalletStore';
import { PinPad } from '../components/PinPad';
import { Button, Muted, Screen, colors } from '../components/ui';

/** Shows the active wallet's EVM private key after the PIN is entered. */
export default function ExportKeyScreen() {
  const { verifyPin, active } = useWalletStore();
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!unlocked || !active) {
    return (
      <PinPad
        title="Enter PIN"
        subtitle={`Export the private key of ${active?.name ?? 'this wallet'}`}
        error={error}
        resetKey={attempt}
        onComplete={async (pin) => {
          if (await verifyPin(pin)) setUnlocked(true);
          else {
            setError('Wrong PIN');
            setAttempt((a) => a + 1);
          }
        }}
      />
    );
  }

  const key = active.keys.privateKey;
  return (
    <Screen>
      <Text style={s.title}>{active.name}</Text>
      <Muted>
        This is the Ethereum / Sepolia private key. Anyone who has it can take the funds. Never share it or paste it
        into a website.
      </Muted>
      <View style={s.box}>
        <Text style={s.key} selectable>
          {key}
        </Text>
      </View>
      <Button
        title={copied ? 'Copied!' : 'Copy to clipboard'}
        variant="secondary"
        onPress={async () => {
          await Clipboard.setStringAsync(key);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  box: { backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  key: { color: colors.text, fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
});
