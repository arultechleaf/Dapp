import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useWalletStore } from '../../../controllers/WalletStore';
import { Button, Card, Muted, Screen, colors } from '../../components/ui';
import { PhraseGrid } from '../../components/PhraseGrid';

/** Shows the new recovery phrase and asks the user to write it down before verifying. */
export default function BackupScreen() {
  const { pendingMnemonic, beginCreate } = useWalletStore();
  const [revealed, setRevealed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!pendingMnemonic) {
    return (
      <Screen>
        <Card title="Create a new wallet">
          <Muted>Generate a new 12-word recovery phrase for this wallet.</Muted>
          <Button title="Generate recovery phrase" onPress={() => beginCreate()} />
        </Card>
      </Screen>
    );
  }

  const words = pendingMnemonic.split(' ');

  return (
    <Screen>
      <Text style={s.title}>Your recovery phrase</Text>
      <Muted>
        Write these 12 words down in order and keep them somewhere safe. They are the only way to recover this
        wallet — anyone who has them controls it.
      </Muted>

      <Pressable onPress={() => setRevealed(true)} style={s.phraseBox}>
        <PhraseGrid words={words} hidden={!revealed} />
        {!revealed ? (
          <View style={s.cover}>
            <Ionicons name="eye-off-outline" size={28} color={colors.text} />
            <Text style={s.coverText}>Tap to reveal your phrase</Text>
            <Text style={s.coverHint}>Make sure no one is watching your screen</Text>
          </View>
        ) : null}
      </Pressable>

      {revealed ? (
        <Button
          title={copied ? 'Copied!' : 'Copy to clipboard'}
          variant="secondary"
          onPress={async () => {
            await Clipboard.setStringAsync(pendingMnemonic);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        />
      ) : null}

      <Pressable onPress={() => setSaved((v) => !v)} style={s.check}>
        <Ionicons name={saved ? 'checkbox' : 'square-outline'} size={24} color={saved ? colors.primary : colors.muted} />
        <Text style={s.checkText}>{"I wrote down my recovery phrase. If I lose it, my wallet can't be recovered."}</Text>
      </Pressable>

      <Button title="Continue" disabled={!revealed || !saved} onPress={() => router.push('/onboarding/verify')} />
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  phraseBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cover: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(11,15,26,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coverText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  coverHint: { color: colors.muted, fontSize: 13 },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 4 },
  checkText: { color: colors.text, fontSize: 14, lineHeight: 20, flex: 1 },
});
