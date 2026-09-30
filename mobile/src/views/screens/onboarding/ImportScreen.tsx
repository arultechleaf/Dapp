import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useWalletStore } from '../../../controllers/WalletStore';
import { errorMessage } from '../../../models/format';
import { Button, Field, Muted, Screen, StatusMessage, colors, type Status } from '../../components/ui';

/** Recover / add an existing wallet from its 12 (or 24) word recovery phrase. */
export default function ImportScreen() {
  const { importWallet } = useWalletStore();
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>();

  const wordCount = phrase.trim() ? phrase.trim().split(/\s+/).length : 0;

  return (
    <Screen>
      <Text style={s.title}>Recover wallet</Text>
      <Muted>
        Enter the recovery phrase of the wallet you want to add. It restores the same Bitcoin and Ethereum
        addresses. Testnet use only — never enter the phrase of a wallet that holds real funds.
      </Muted>

      <Field
        label={`Recovery phrase · ${wordCount} words`}
        placeholder="word1 word2 word3 …"
        value={phrase}
        onChangeText={(text) => {
          setPhrase(text);
          setStatus(undefined);
        }}
        multiline
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />
      <Button
        title="Paste from clipboard"
        variant="secondary"
        onPress={async () => setPhrase((await Clipboard.getStringAsync()).trim())}
      />

      <StatusMessage status={status} />
      <Button
        title="Import wallet"
        loading={busy}
        disabled={wordCount !== 12 && wordCount !== 24}
        onPress={async () => {
          setBusy(true);
          try {
            await importWallet(phrase);
            router.replace('/');
          } catch (e) {
            setStatus({ kind: 'error', text: `Invalid recovery phrase: ${errorMessage(e)}` });
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
});
