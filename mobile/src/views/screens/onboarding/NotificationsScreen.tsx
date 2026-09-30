import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { usePrefs } from '../../../controllers/PrefsStore';
import { useWalletStore } from '../../../controllers/WalletStore';
import { requestNotificationPermission } from '../../../models/services/notifications';
import { Button, Screen, colors } from '../../components/ui';

/** Onboarding step after the PIN: enable notifications or skip. */
export default function NotificationsScreen() {
  const { next } = useLocalSearchParams<{ next?: 'create' | 'import' }>();
  const { beginCreate } = useWalletStore();
  const { update } = usePrefs();
  const [busy, setBusy] = useState(false);

  function proceed() {
    if (next === 'import') {
      router.replace('/onboarding/import');
    } else {
      beginCreate();
      router.replace('/onboarding/backup');
    }
  }

  async function choose(enable: boolean) {
    setBusy(true);
    const granted = enable ? await requestNotificationPermission() : false;
    await update({ notifications: enable && granted });
    setBusy(false);
    proceed();
  }

  return (
    <Screen contentStyle={s.content}>
      <View style={s.icon}>
        <Ionicons name="notifications" size={44} color="#fff" />
      </View>
      <Text style={s.title}>Enable notifications</Text>
      <Text style={s.body}>Get alerts about your wallet activity. You can change this any time in Settings → Preferences.</Text>
      <View style={s.actions}>
        <Button title="Enable" onPress={() => choose(true)} disabled={busy} />
        <Button title="Skip" variant="secondary" onPress={() => choose(false)} disabled={busy} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 12 },
});
