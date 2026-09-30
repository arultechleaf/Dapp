import Constants from 'expo-constants';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { PRIVACY_URL, REVIEW_URL, SUPPORT_EMAIL, TERMS_URL } from '../../models/config/env';
import { Logo } from '../components/Logo';
import { Screen, colors } from '../components/ui';
import { MenuRow } from '../components/wallet';

/** Version, legal links, review and support. Rows for unset links are hidden. */
export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const mail = (subject: string) => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`);

  return (
    <Screen>
      <View style={s.brand}>
        <Logo size={72} />
        <Text style={s.brandName}>Coinstep</Text>
      </View>
      <Text style={s.section}>About</Text>
      <View style={s.group}>
        <View style={s.versionRow}>
          <Text style={s.title}>Version</Text>
          <Text style={s.value}>{version}</Text>
        </View>
        {PRIVACY_URL ? (
          <MenuRow icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
        ) : null}
        {TERMS_URL ? (
          <MenuRow icon="document-text-outline" title="Terms of Service" onPress={() => Linking.openURL(TERMS_URL)} />
        ) : null}
        {REVIEW_URL ? (
          <MenuRow icon="star-outline" title="Review the app" onPress={() => Linking.openURL(REVIEW_URL)} />
        ) : null}
        {SUPPORT_EMAIL ? (
          <MenuRow icon="bulb-outline" title="Make a suggestion" onPress={() => mail('Suggestion for Coinstep')} />
        ) : null}
      </View>

      {SUPPORT_EMAIL ? (
        <>
          <Text style={s.section}>Support</Text>
          <View style={s.group}>
            <MenuRow
              icon="help-buoy-outline"
              title="Contact support"
              subtitle={SUPPORT_EMAIL}
              onPress={() => mail('Coinstep support')}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  brand: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  brandName: { color: colors.text, fontSize: 22, fontWeight: '800' },
  section: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: -8 },
  group: { backgroundColor: colors.card, borderRadius: 16, paddingVertical: 4 },
  versionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  title: { color: colors.text, fontSize: 16, fontWeight: '500' },
  value: { color: colors.muted, fontSize: 16 },
});
