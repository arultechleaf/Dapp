import { StyleSheet, Text, View } from 'react-native';

import { colors } from './ui';

/** Numbered 2-column grid of recovery-phrase words. */
export function PhraseGrid({ words, hidden }: { words: string[]; hidden?: boolean }) {
  return (
    <View style={s.grid}>
      {words.map((word, i) => (
        <View key={i} style={s.cell}>
          <Text style={s.index}>{i + 1}</Text>
          <Text style={s.word} selectable={!hidden}>
            {hidden ? '•••••' : word}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  index: { color: colors.muted, fontSize: 13, width: 18, textAlign: 'right' },
  word: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
