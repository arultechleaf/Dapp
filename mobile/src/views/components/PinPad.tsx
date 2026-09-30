import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './ui';

export const PIN_LENGTH = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

type Props = {
  title: string;
  subtitle?: string;
  error?: string;
  busy?: boolean;
  /** Called once 6 digits are entered. Clear the pad by changing `resetKey`. */
  onComplete: (pin: string) => void;
  resetKey?: unknown;
};

/** Full-screen 6-digit PIN entry with dots and a numeric keypad. Changing `resetKey` clears it. */
export function PinPad(props: Props) {
  return <PinPadInner key={String(props.resetKey ?? '')} {...props} />;
}

function PinPadInner({ title, subtitle, error, busy, onComplete }: Props) {
  const [pin, setPin] = useState('');

  function press(key: string) {
    if (busy) return;
    if (key === 'del') return setPin((p) => p.slice(0, -1));
    if (!key || pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) onComplete(next);
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View style={s.lock}>
          <Ionicons name="lock-closed" size={28} color={colors.primary} />
        </View>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        <View style={s.dots}>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <View key={i} style={[s.dot, i < pin.length && s.dotFilled, !!error && s.dotError]} />
          ))}
        </View>
        <View style={s.feedback}>
          {busy ? (
            <ActivityIndicator color={colors.muted} />
          ) : error ? (
            <Text style={s.error}>{error}</Text>
          ) : null}
        </View>
      </View>

      <View style={s.pad}>
        {KEYS.map((key, i) => (
          <Pressable
            key={i}
            accessibilityLabel={key === 'del' ? 'Delete' : key}
            disabled={!key}
            onPress={() => press(key)}
            style={({ pressed }) => [s.key, pressed && !!key && s.keyPressed]}
          >
            {key === 'del' ? (
              <Ionicons name="backspace-outline" size={26} color={colors.text} />
            ) : (
              <Text style={s.keyText}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'space-between',
    paddingVertical: 32,
    ...(Platform.OS === 'web' ? { maxWidth: 480, width: '100%', alignSelf: 'center' as const } : {}),
  },
  header: { alignItems: 'center', paddingHorizontal: 24, gap: 10, paddingTop: 24 },
  lock: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  dots: { flexDirection: 'row', gap: 14, marginTop: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.muted },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotError: { borderColor: colors.danger },
  feedback: { minHeight: 28, justifyContent: 'center' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 32 },
  key: { width: '33.33%', height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 36 },
  keyPressed: { backgroundColor: colors.card },
  keyText: { color: colors.text, fontSize: 28, fontWeight: '500' },
});
