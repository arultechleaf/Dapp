import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { usePrefs } from '../../controllers/PrefsStore';
import { requestNotificationPermission } from '../../models/services/notifications';
import { CURRENCIES } from '../../models/services/prefsStorage';
import { Muted, Screen, StatusMessage, colors } from '../components/ui';
import { MenuRow } from '../components/wallet';

/** Currency and notifications. */
export default function PreferencesScreen() {
  const { prefs, update } = usePrefs();
  const [message, setMessage] = useState<string>();

  async function toggleNotifications(on: boolean) {
    if (on && !(await requestNotificationPermission())) {
      setMessage('Notification permission was not granted. Allow it in the phone settings to turn this on.');
      return;
    }
    setMessage(undefined);
    await update({ notifications: on });
  }

  return (
    <Screen>
      <StatusMessage status={message ? { kind: 'error', text: message } : undefined} />

      <Text style={s.section}>Currency</Text>
      <View style={s.group}>
        {CURRENCIES.map((c) => (
          <MenuRow
            key={c.code}
            icon={prefs.currency === c.code ? 'radio-button-on' : 'radio-button-off'}
            title={c.code}
            subtitle={c.label}
            onPress={() => update({ currency: c.code })}
          />
        ))}
      </View>
      <Muted>Balances and market prices are shown in this currency, converted from USD.</Muted>

      <Text style={s.section}>Notifications</Text>
      <View style={s.group}>
        <View style={s.switchRow}>
          <Text style={s.title}>Allow notifications</Text>
          <Switch value={prefs.notifications} onValueChange={toggleNotifications} />
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  section: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: -8 },
  group: { backgroundColor: colors.card, borderRadius: 16, paddingVertical: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  title: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '500' },
});
