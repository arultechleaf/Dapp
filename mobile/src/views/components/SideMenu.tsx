import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWalletStore } from '../../controllers/WalletStore';
import { shortAddress } from '../../models/format';
import { colors } from './ui';
import { MenuRow } from './wallet';

/** Slide-in drawer from the left: History, Settings, Recover wallet, Lock (logout). */
export function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { active, lock } = useWalletStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(320, width * 0.82);
  const [x] = useState(() => new Animated.Value(-panelWidth));

  useEffect(() => {
    Animated.timing(x, { toValue: visible ? 0 : -panelWidth, duration: 220, useNativeDriver: true }).start();
  }, [visible, panelWidth, x]);

  const go = (href: Href) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          s.panel,
          { width: panelWidth, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
          { transform: [{ translateX: x }] },
        ]}
      >
        <View style={s.header}>
          <View style={s.avatar}>
            <Ionicons name="wallet" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{active?.name ?? 'Wallet'}</Text>
            <Text style={s.address}>{shortAddress(active?.keys.address, 6)}</Text>
          </View>
        </View>

        <MenuRow icon="time-outline" title="History" subtitle="Sent & received" onPress={() => go('/history')} />
        <MenuRow icon="settings-outline" title="Settings" subtitle="Wallets, PIN, security" onPress={() => go('/settings')} />
        <MenuRow
          icon="refresh-circle-outline"
          title="Recover wallet"
          subtitle="Import with a recovery phrase"
          onPress={() => go('/onboarding/import')}
        />
        <MenuRow icon="code-slash-outline" title="Contract Functions" subtitle="DappContract dApp" onPress={() => go('/contract')} />

        <View style={{ flex: 1 }} />
        <MenuRow
          icon="log-out-outline"
          title="Lock wallet"
          subtitle="Log out — PIN needed to open"
          danger
          onPress={() => {
            onClose();
            lock();
          }}
        />
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderRightColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    gap: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingBottom: 20 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  address: { color: colors.muted, fontSize: 13, fontFamily: 'monospace', marginTop: 2 },
});
