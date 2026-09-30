import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useWalletStore } from '../../../controllers/WalletStore';
import { errorMessage } from '../../../models/format';
import { Button, Card, Muted, Screen, StatusMessage, colors, type Status } from '../../components/ui';

const CHECKS = 3;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Builds 3 quiz questions: "which is word #n?" with 3 options each. */
function buildQuiz(words: string[]) {
  const positions = shuffle(words.map((_, i) => i))
    .slice(0, CHECKS)
    .sort((a, b) => a - b);
  return positions.map((pos) => {
    const decoys = shuffle(words.filter((w) => w !== words[pos])).slice(0, 2);
    return { pos, answer: words[pos], options: shuffle([words[pos], ...decoys]) };
  });
}

/** Confirms the user wrote the phrase down, then saves the wallet. */
export default function VerifyScreen() {
  const { pendingMnemonic, finishCreate } = useWalletStore();
  const quiz = useMemo(() => (pendingMnemonic ? buildQuiz(pendingMnemonic.split(' ')) : []), [pendingMnemonic]);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>();

  if (!pendingMnemonic) {
    return (
      <Screen>
        <Card title="Nothing to verify">
          <Muted>Start again from “Create a new wallet”.</Muted>
          <Button title="Back" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  const allAnswered = quiz.every((q) => picked[q.pos]);
  const allCorrect = quiz.every((q) => picked[q.pos] === q.answer);

  return (
    <Screen>
      <Text style={s.title}>Verify recovery phrase</Text>
      <Muted>Tap the correct word for each position to prove you saved your phrase.</Muted>

      {quiz.map((q) => {
        const choice = picked[q.pos];
        return (
          <View key={q.pos} style={s.question}>
            <Text style={s.label}>{`Word #${q.pos + 1}`}</Text>
            <View style={s.options}>
              {q.options.map((word) => {
                const selected = choice === word;
                const wrong = selected && word !== q.answer;
                return (
                  <Pressable
                    key={word}
                    onPress={() => {
                      setStatus(undefined);
                      setPicked((p) => ({ ...p, [q.pos]: word }));
                    }}
                    style={[s.option, selected && s.optionSelected, wrong && s.optionWrong]}
                  >
                    <Text style={s.optionText}>{word}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <StatusMessage status={status} />
      <Button
        title="Complete"
        loading={busy}
        disabled={!allAnswered}
        onPress={async () => {
          if (!allCorrect) {
            setStatus({ kind: 'error', text: 'Some words are wrong. Check your written phrase and try again.' });
            return;
          }
          setBusy(true);
          try {
            await finishCreate();
            router.replace('/');
          } catch (e) {
            setStatus({ kind: 'error', text: errorMessage(e) });
            setBusy(false);
          }
        }}
      />
      <Pressable onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={16} color={colors.muted} />
        <Text style={s.backText}>Show my phrase again</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  question: { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 10 },
  label: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#1B2440' },
  optionWrong: { borderColor: colors.danger },
  optionText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  back: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  backText: { color: colors.muted, fontSize: 14 },
});
