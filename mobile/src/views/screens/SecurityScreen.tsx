import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { usePrefs } from '../../controllers/PrefsStore';
import { useWalletStore } from '../../controllers/WalletStore';
import { authenticateBiometric, biometricsAvailable } from '../../models/services/biometrics';
import { AUTO_LOCK_OPTIONS } from '../../models/services/prefsStorage';
import { Muted, Screen, StatusMessage, colors } from '../components/ui';
import { MenuRow } from '../components/wallet';

/** Passcode, biometrics, auto-lock and secret backup. */
export default function SecurityScreen() {
  const store = useWalletStore();
  const { prefs, update } = usePrefs();
  const [bioAvailable, setBioAvailable] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    biometricsAvailable().then(setBioAvailable);
  }, []);

  async function toggleBiometric(on: boolean) {
    if (on && !(await authenticateBiometric('Enable biometric unlock'))) {
      setMessage('Biometric check failed — not enabled.');
      return;
    }
    setMessage(undefined);
    await update({ biometric: on });
  }

  return (
    <Screen>
      <StatusMessage status={message ? { kind: 'error', text: message } : undefined} />

      <Text style={s.section}>Passcode</Text>
      <View style={s.group}>
        <MenuRow icon="keypad-outline" title="Change PIN" onPress={() => router.push('/change-pin')} />
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Biometric unlock</Text>
            <Muted>{bioAvailable ? 'Use fingerprint or face to open the wallet' : 'Not available on this device'}</Muted>
          </View>
          <Switch value={prefs.biometric} onValueChange={toggleBiometric} disabled={!bioAvailable} />
        </View>
      </View>

      <Text style={s.section}>Auto-lock</Text>
      <View style={s.group}>
        {AUTO_LOCK_OPTIONS.map((o) => (
          <MenuRow
            key={o.minutes}
            icon={prefs.autoLockMinutes === o.minutes ? 'radio-button-on' : 'radio-button-off'}
            title={o.label}
            onPress={() => update({ autoLockMinutes: o.minutes })}
          />
        ))}
      </View>
      <Muted>Locks the wallet after the app has been in the background for this long.</Muted>

      <Text style={s.section}>Backup</Text>
      <View style={s.group}>
        <MenuRow icon="key-outline" title="Backup phrase" subtitle="Requires your PIN" onPress={() => router.push('/phrase')} />
        <MenuRow icon="lock-closed-outline" title="Lock wallet now" onPress={store.lock} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  section: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: -8 },
  group: { backgroundColor: colors.card, borderRadius: 16, paddingVertical: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  title: { color: colors.text, fontSize: 16, fontWeight: '500' },
});
