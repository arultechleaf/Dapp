import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAssets } from '../../controllers/useAssets';
import { formatAssetAmount } from '../../models/assetAmounts';
import { ASSETS, type Asset } from '../../models/config/assets';
import { Button, Muted, Screen, colors } from '../components/ui';
import { CoinBadge } from '../components/wallet';

function nextAsset(current: Asset, skip: Asset) {
  const others = ASSETS.filter((a) => a.id !== skip.id);
  return others[(others.findIndex((a) => a.id === current.id) + 1) % others.length];
}

/** Trust-style swap form. Disabled: testnets have no swap liquidity (and BTC↔ETH needs a bridge). */
export default function SwapScreen() {
  const { byId } = useAssets();
  const [from, setFrom] = useState<Asset>(ASSETS[1]);
  const [to, setTo] = useState<Asset>(ASSETS[0]);
  const [amount, setAmount] = useState('');

  const fromBalance = byId(from.id)?.balance;

  return (
    <Screen>
      <View style={s.notice}>
        <Ionicons name="information-circle" size={22} color={colors.primary} />
        <Text style={s.noticeText}>
          Swaps are not available on testnets: there is no liquidity for test coins, and swapping Bitcoin ↔ Ethereum
          needs a cross-chain bridge. This screen shows how swapping will work.
        </Text>
      </View>

      <View style={s.box}>
        <Text style={s.label}>You pay</Text>
        <View style={s.line}>
          <TextInput
            style={s.amount}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Pressable style={s.token} onPress={() => setFrom(nextAsset(from, to))}>
            <CoinBadge asset={from} size={26} />
            <Text style={s.tokenText}>{from.symbol}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Muted>
          {fromBalance !== undefined ? `Balance: ${formatAssetAmount(from, fromBalance, 6)} ${from.symbol}` : ' '}
        </Muted>
      </View>

      <Pressable
        accessibilityLabel="Flip"
        style={s.flip}
        onPress={() => {
          setFrom(to);
          setTo(from);
        }}
      >
        <Ionicons name="swap-vertical" size={22} color="#fff" />
      </Pressable>

      <View style={s.box}>
        <Text style={s.label}>You receive</Text>
        <View style={s.line}>
          <Text style={[s.amount, { color: colors.muted }]}>—</Text>
          <Pressable style={s.token} onPress={() => setTo(nextAsset(to, from))}>
            <CoinBadge asset={to} size={26} />
            <Text style={s.tokenText}>{to.symbol}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Muted>Rate: no testnet quote available</Muted>
      </View>

      <Button title="Swap unavailable on testnet" disabled onPress={() => {}} />
    </Screen>
  );
}

const s = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 10, backgroundColor: '#16203A', borderRadius: 14, padding: 14 },
  noticeText: { color: colors.text, fontSize: 13, lineHeight: 19, flex: 1 },
  box: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 8 },
  label: { color: colors.muted, fontSize: 13 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amount: { flex: 1, color: colors.text, fontSize: 28, fontWeight: '700', padding: 0 },
  token: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tokenText: { color: colors.text, fontWeight: '700' },
  flip: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -8,
    zIndex: 1,
  },
});
