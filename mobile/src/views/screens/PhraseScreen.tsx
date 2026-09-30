import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useWalletStore } from '../../controllers/WalletStore';
import { PhraseGrid } from '../components/PhraseGrid';
import { PinPad } from '../components/PinPad';
import { Button, Muted, Screen, colors } from '../components/ui';

/** Shows the active wallet's recovery phrase after the PIN is entered. */
export default function PhraseScreen() {
  const { revealPhrase, active } = useWalletStore();
  const [phrase, setPhrase] = useState<string>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!phrase) {
    return (
      <PinPad
        title="Enter PIN"
        subtitle={`Show the recovery phrase of ${active?.name ?? 'this wallet'}`}
        error={error}
        resetKey={attempt}
        onComplete={async (pin) => {
          const result = await revealPhrase(pin);
          if (result) setPhrase(result);
          else {
            setError('Wrong PIN');
            setAttempt((a) => a + 1);
          }
        }}
      />
    );
  }

  return (
    <Screen>
      <Text style={s.title}>{active?.name}</Text>
      <Muted>Never share these words. Anyone with them can take the funds in this wallet.</Muted>
      <View style={s.box}>
        <PhraseGrid words={phrase.split(' ')} />
      </View>
      <Button
        title={copied ? 'Copied!' : 'Copy to clipboard'}
        variant="secondary"
        onPress={async () => {
          await Clipboard.setStringAsync(phrase);
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
});
