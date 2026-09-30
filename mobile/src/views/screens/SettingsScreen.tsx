import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useWalletStore } from '../../controllers/WalletStore';
import { Button, Field, Screen, colors } from '../components/ui';
import { MenuRow } from '../components/wallet';

/** Wallets, security (PIN, recovery phrase, lock), developer tools and reset. */
export default function SettingsScreen() {
  const store = useWalletStore();
  const [editing, setEditing] = useState<string>();
  const [name, setName] = useState('');

  return (
    <Screen>
      <Text style={s.section}>Wallets</Text>
      <View style={s.group}>
        {store.wallets.map((w) => {
          const isActive = w.id === store.active?.id;
          const open = editing === w.id;
          return (
            <View key={w.id}>
              <Pressable
                onPress={() => {
                  setEditing(open ? undefined : w.id);
                  setName(w.name);
                }}
                style={s.wallet}
              >
                <Ionicons name="wallet-outline" size={22} color={colors.text} />
                <Text style={s.walletName}>{w.name}</Text>
                {isActive ? <Text style={s.activeTag}>Active</Text> : null}
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </Pressable>
              {open ? (
                <View style={s.editor}>
                  <Field label="Wallet name" value={name} onChangeText={setName} />
                  <Button
                    title="Save name"
                    variant="secondary"
                    onPress={async () => {
                      await store.renameWallet(w.id, name);
                      setEditing(undefined);
                    }}
                  />
                  {!isActive ? (
                    <Button title="Switch to this wallet" variant="secondary" onPress={() => store.switchWallet(w.id)} />
                  ) : null}
                  <Button
                    title="Remove wallet"
                    variant="danger"
                    onPress={() =>
                      Alert.alert(
                        `Remove ${w.name}?`,
                        'It will be deleted from this phone. Make sure you have its recovery phrase to restore it later.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => store.removeWallet(w.id) },
                        ],
                      )
                    }
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        <MenuRow icon="download-outline" title="Recover / add wallet" onPress={() => router.push('/onboarding/import')} />
      </View>

      <Text style={s.section}>Security</Text>
      <View style={s.group}>
        <MenuRow
          icon="key-outline"
          title="Show recovery phrase"
          subtitle="Requires your PIN"
          onPress={() => router.push('/phrase')}
        />
        <MenuRow icon="keypad-outline" title="Change PIN" onPress={() => router.push('/change-pin')} />
        <MenuRow icon="lock-closed-outline" title="Lock wallet (log out)" onPress={store.lock} />
      </View>

      <Text style={s.section}>Developer</Text>
      <View style={s.group}>
        <MenuRow
          icon="code-slash-outline"
          title="Contract Functions"
          subtitle="DappContract on Sepolia / Hardhat"
          onPress={() => router.push('/contract')}
        />
        <MenuRow
          icon="link-outline"
          title="Connect external wallet"
          subtitle="MetaMask / Trust Wallet via WalletConnect"
          onPress={() => router.push('/connect')}
        />
      </View>

      <View style={s.group}>
        <MenuRow
          icon="trash-outline"
          title="Reset app"
          subtitle="Remove all wallets and the PIN"
          danger
          onPress={() =>
            Alert.alert('Reset app?', 'All wallets and your PIN will be removed from this phone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => store.resetAll() },
            ])
          }
        />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  section: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: -8 },
  group: { backgroundColor: colors.card, borderRadius: 16, paddingVertical: 4 },
  wallet: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  walletName: { color: colors.text, fontSize: 16, fontWeight: '500', flex: 1 },
  activeTag: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  editor: { paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
});
