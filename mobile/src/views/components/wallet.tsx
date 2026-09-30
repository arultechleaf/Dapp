import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Asset } from '../../models/config/assets';
import { colors } from './ui';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Round colored coin logo with a small network tag. */
export function CoinBadge({ asset, size = 42 }: { asset: Asset; size?: number }) {
  return (
    <View
      style={[
        s.badge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.color },
      ]}
    >
      <Text style={[s.badgeText, { fontSize: size * 0.45 }]}>{asset.badge}</Text>
    </View>
  );
}

/** Trust-style round action button with a label underneath (Send / Receive / Swap / …). */
export function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.action, pressed && { opacity: 0.6 }]}>
      <View style={s.actionCircle}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  );
}

/** Tappable settings-style row with an icon, title, optional subtitle and chevron. */
export function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.card }]}>
      <Ionicons name={icon} size={22} color={tint} />
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, { color: tint }]}>{title}</Text>
        {subtitle ? <Text style={s.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '800' },
  action: { alignItems: 'center', gap: 6, flex: 1 },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: colors.text, fontSize: 13, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
