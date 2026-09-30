import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWalletStore } from '../../controllers/WalletStore';
import { colors } from './ui';
import { MenuRow } from './wallet';

/** Bottom sheet listing all wallets, with "Add wallet" (create or import). */
export function WalletSwitcher({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { wallets, active, switchWallet, beginCreate } = useWalletStore();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.grabber} />
        <Text style={s.title}>Wallets</Text>

        {wallets.map((w) => {
          const selected = w.id === active?.id;
          return (
            <Pressable
              key={w.id}
              onPress={async () => {
                await switchWallet(w.id);
                onClose();
              }}
              style={({ pressed }) => [s.wallet, selected && s.walletSelected, pressed && { opacity: 0.7 }]}
            >
              <View style={s.avatar}>
                <Ionicons name="wallet" size={20} color="#fff" />
              </View>
              <Text style={s.walletName}>{w.name}</Text>
              {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        })}

        <View style={s.divider} />
        <MenuRow
          icon="add-circle-outline"
          title="Create new wallet"
          subtitle="New 12-word recovery phrase"
          onPress={() => {
            onClose();
            beginCreate();
            router.push('/onboarding/backup');
          }}
        />
        <MenuRow
          icon="download-outline"
          title="Add existing wallet"
          subtitle="Import with a recovery phrase"
          onPress={() => {
            onClose();
            router.push('/onboarding/import');
          }}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 4,
    ...(Platform.OS === 'web'
      ? { maxWidth: 480, marginHorizontal: 'auto', alignSelf: 'center' as const, borderLeftWidth: 1, borderRightWidth: 1, borderTopWidth: 1, borderColor: colors.border }
      : {}),
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', paddingHorizontal: 12, paddingBottom: 8 },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  walletSelected: { backgroundColor: colors.card },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletName: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 8 },
});
