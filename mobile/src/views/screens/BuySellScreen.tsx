import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useExternalSigner } from '../../controllers/useWallet';
import { MOONPAY_API_KEY } from '../../models/config/env';
import { Button, Field, Muted, Screen, colors } from '../components/ui';

type Mode = 'buy' | 'sell';
type Coin = 'btc' | 'eth';

const COINS: { id: Coin; name: string; symbol: string; color: string }[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
];

/** Opens the provider's buy / sell page (MoonPay). Payment and KYC happen on the provider's site. */
function providerUrl(mode: Mode, coin: Coin, address: string) {
  if (!MOONPAY_API_KEY) return `https://www.moonpay.com/${mode}/${coin}`;
  const params = new URLSearchParams({ apiKey: MOONPAY_API_KEY });
  if (mode === 'buy') {
    params.set('currencyCode', coin);
    if (address) params.set('walletAddress', address);
    return `https://buy.moonpay.com?${params}`;
  }
  params.set('baseCurrencyCode', coin);
  return `https://sell.moonpay.com?${params}`;
}

/** Buy or sell BTC / ETH for real money through a payment provider. */
export default function BuySellScreen() {
  const { mode: initial } = useLocalSearchParams<{ mode?: Mode }>();
  const external = useExternalSigner();
  const [mode, setMode] = useState<Mode>(initial === 'sell' ? 'sell' : 'buy');
  const [coin, setCoin] = useState<Coin>('btc');
  const [address, setAddress] = useState('');

  const receiving = coin === 'eth' && !address ? (external.address ?? '') : address;

  return (
    <Screen>
      <View style={s.tabs}>
        {(['buy', 'sell'] as Mode[]).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[s.tab, mode === m && s.tabActive]}>
            <Text style={[s.tabText, mode === m && { color: '#fff' }]}>{m === 'buy' ? 'Buy' : 'Sell'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.coins}>
        {COINS.map((c) => (
          <Pressable key={c.id} onPress={() => setCoin(c.id)} style={[s.coin, coin === c.id && { borderColor: c.color }]}>
            <View style={[s.dot, { backgroundColor: c.color }]}>
              <Text style={s.dotText}>{c.symbol === 'BTC' ? '₿' : 'Ξ'}</Text>
            </View>
            <Text style={s.coinName}>{c.name}</Text>
            <Text style={s.coinSymbol}>{c.symbol}</Text>
          </Pressable>
        ))}
      </View>

      {mode === 'buy' ? (
        <Field
          label={`Deliver ${coin.toUpperCase()} to (optional)`}
          placeholder={coin === 'btc' ? 'bc1…' : (external.address ?? '0x…')}
          value={address}
          onChangeText={setAddress}
        />
      ) : null}

      <View style={s.notice}>
        <Ionicons name="warning" size={20} color={colors.warning} />
        <Text style={s.noticeText}>
          This is real money on the main network. This app only signs testnet transactions with its built-in key, so
          use an address from your own mainnet wallet (for example MetaMask via Settings → Connected apps). Coins
          bought to a testnet address are not the same as real coins.
        </Text>
      </View>

      <Button
        title={`${mode === 'buy' ? 'Buy' : 'Sell'} ${coin.toUpperCase()} with MoonPay`}
        onPress={() => Linking.openURL(providerUrl(mode, coin, receiving))}
      />
      <Muted>
        You leave the app to complete payment and identity checks on the provider&apos;s website. Fees and availability
        depend on your country.
      </Muted>
    </Screen>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.muted, fontWeight: '700' },
  coins: { flexDirection: 'row', gap: 12 },
  coin: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 16,
  },
  dot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  coinName: { color: colors.text, fontWeight: '700' },
  coinSymbol: { color: colors.muted, fontSize: 12 },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: '#2A2110', borderRadius: 14, padding: 14 },
  noticeText: { color: colors.text, fontSize: 13, lineHeight: 19, flex: 1 },
});
