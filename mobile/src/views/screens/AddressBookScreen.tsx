import { Ionicons } from '@expo/vector-icons';
import { isAddress } from 'ethers';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePrefs } from '../../controllers/PrefsStore';
import { shortAddress } from '../../models/format';
import type { ContactKind } from '../../models/services/prefsStorage';
import { confirmAction } from '../components/confirm';
import { Button, Card, Field, Muted, Screen, StatusMessage, colors } from '../components/ui';

const KINDS: { kind: ContactKind; label: string }[] = [
  { kind: 'evm', label: 'Ethereum' },
  { kind: 'bitcoin', label: 'Bitcoin' },
  { kind: 'solana', label: 'Solana' },
];

/** Cheap format checks so obviously wrong addresses are not saved. */
function validAddress(kind: ContactKind, address: string) {
  if (kind === 'evm') return isAddress(address);
  if (kind === 'bitcoin') return /^(bc1|tb1|[13mn2])[a-zA-Z0-9]{25,90}$/.test(address);
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/** Saved addresses. They appear as quick picks on the Send screen. */
export default function AddressBookScreen() {
  const { contacts, addContact, removeContact } = usePrefs();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [kind, setKind] = useState<ContactKind>('evm');
  const [error, setError] = useState<string>();

  async function save() {
    const trimmed = address.trim();
    if (!name.trim()) return setError('Enter a name.');
    if (!validAddress(kind, trimmed)) return setError('That is not a valid address for this network.');
    if (contacts.some((c) => c.address.toLowerCase() === trimmed.toLowerCase())) return setError('Already saved.');
    setError(undefined);
    await addContact({ name: name.trim(), address: trimmed, kind });
    setName('');
    setAddress('');
  }

  return (
    <Screen>
      <Card title="Add address">
        <View style={s.kinds}>
          {KINDS.map((k) => (
            <Pressable key={k.kind} onPress={() => setKind(k.kind)} style={[s.kind, kind === k.kind && s.kindActive]}>
              <Text style={[s.kindText, kind === k.kind && { color: '#fff' }]}>{k.label}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Name" placeholder="e.g. Alice" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field label="Address" placeholder="Paste address" value={address} onChangeText={setAddress} />
        <StatusMessage status={error ? { kind: 'error', text: error } : undefined} />
        <Button title="Save address" onPress={save} />
      </Card>

      {contacts.length === 0 ? <Muted>No saved addresses yet.</Muted> : null}
      {contacts.map((c) => (
        <View key={c.id} style={s.contact}>
          <View style={{ flex: 1 }}>
            <Text style={s.contactName}>{c.name}</Text>
            <Text style={s.contactAddr}>
              {KINDS.find((k) => k.kind === c.kind)?.label} · {shortAddress(c.address, 8)}
            </Text>
          </View>
          <Pressable accessibilityLabel="Copy" onPress={() => Clipboard.setStringAsync(c.address)} style={s.icon}>
            <Ionicons name="copy-outline" size={20} color={colors.muted} />
          </Pressable>
          <Pressable
            accessibilityLabel="Delete"
            onPress={() =>
              confirmAction(`Delete ${c.name}?`, 'This removes the saved address.', 'Delete', () => removeContact(c.id))
            }
            style={s.icon}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  kinds: { flexDirection: 'row', gap: 8 },
  kind: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  kindActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  kindText: { color: colors.muted, fontWeight: '600' },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
  },
  contactName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  contactAddr: { color: colors.muted, fontSize: 12, marginTop: 2, fontFamily: 'monospace' },
  icon: { padding: 8 },
});
