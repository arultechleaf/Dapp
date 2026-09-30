import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatUnits } from 'ethers';
import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SLIPPAGE_OPTIONS, useSwap } from '../../controllers/useSwap';
import { SWAP_TOKENS, type SwapToken } from '../../models/services/swapService';
import { Button, Muted, Screen, StatusMessage, colors } from '../components/ui';

const trim = (value: string, decimals = 6) => {
  const [whole, fraction = ''] = value.split('.');
  const f = fraction.slice(0, decimals).replace(/0+$/, '');
  return f ? `${whole}.${f}` : whole;
};

function TokenDot({ token, size = 26 }: { token: SwapToken; size?: number }) {
  return (
    <View style={[s.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: token.color }]}>
      <Text style={[s.dotText, { fontSize: size * 0.42 }]}>{token.symbol.slice(0, 1)}</Text>
    </View>
  );
}

function TokenPicker({
  visible,
  exclude,
  onPick,
  onClose,
}: {
  visible: boolean;
  exclude: SwapToken;
  onPick: (token: SwapToken) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Select token</Text>
          {SWAP_TOKENS.filter((t) => t.symbol !== exclude.symbol).map((t) => (
            <Pressable key={t.symbol} style={s.sheetRow} onPress={() => onPick(t)}>
              <TokenDot token={t} size={34} />
              <View>
                <Text style={s.sheetSymbol}>{t.symbol}</Text>
                <Text style={s.sheetName}>{t.name}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

/** Ethereum mainnet swap (ParaSwap routing). Signed by the connected external wallet; the in-app key is never used. */
export default function SwapScreen() {
  const w = useSwap();
  const [picking, setPicking] = useState<'from' | 'to'>();

  const balanceText = w.balance !== undefined ? `Balance: ${trim(formatUnits(w.balance, w.from.decimals))} ${w.from.symbol}` : ' ';
  const rate =
    w.quote && w.receive && Number(w.amount) > 0
      ? `1 ${w.from.symbol} ≈ ${trim(String(Number(w.receive) / Number(w.amount)), 6)} ${w.to.symbol}`
      : undefined;

  let action = 'Swap';
  if (!w.external.isConnected) action = 'Connect wallet';
  else if (!w.onMainnet) action = 'Switch wallet to Ethereum Mainnet';
  else if (w.insufficient) action = `Insufficient ${w.from.symbol}`;
  else if (w.step === 'approving') action = `Approve ${w.from.symbol} in your wallet…`;
  else if (w.step === 'swapping') action = 'Confirm swap in your wallet…';

  return (
    <Screen>
      <View style={s.notice}>
        <Ionicons name="information-circle" size={22} color={colors.primary} />
        <Text style={s.noticeText}>
          Swaps run on Ethereum Mainnet with real funds and are signed in your connected wallet (MetaMask / Trust). The
          in-app testnet key is never used.
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
            value={w.amount}
            onChangeText={w.setAmount}
          />
          <Pressable style={s.token} onPress={() => setPicking('from')}>
            <TokenDot token={w.from} />
            <Text style={s.tokenText}>{w.from.symbol}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Muted>{balanceText}</Muted>
      </View>

      <Pressable accessibilityLabel="Flip" style={s.flip} onPress={w.flip}>
        <Ionicons name="swap-vertical" size={22} color="#fff" />
      </Pressable>

      <View style={s.box}>
        <Text style={s.label}>You receive (estimated)</Text>
        <View style={s.line}>
          <Text style={[s.amount, !w.receive && { color: colors.muted }]} numberOfLines={1}>
            {w.receive ? trim(w.receive) : '—'}
          </Text>
          <Pressable style={s.token} onPress={() => setPicking('to')}>
            <TokenDot token={w.to} />
            <Text style={s.tokenText}>{w.to.symbol}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Muted>{rate ?? (w.quoteError ? ' ' : 'Enter an amount to get a live quote')}</Muted>
      </View>

      <View style={s.slippage}>
        <Text style={s.label}>Max slippage</Text>
        <View style={s.slippageOptions}>
          {SLIPPAGE_OPTIONS.map((p) => (
            <Pressable key={p} onPress={() => w.setSlippage(p)} style={[s.slip, w.slippage === p && s.slipActive]}>
              <Text style={[s.slipText, w.slippage === p && { color: '#fff' }]}>{p}%</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {w.quote?.gasCostUsd ? <Muted>{`Estimated network fee: ~$${w.quote.gasCostUsd.toFixed(2)}`}</Muted> : null}

      <StatusMessage
        status={
          w.error
            ? { kind: 'error', text: w.error }
            : w.quoteError
              ? { kind: 'error', text: w.quoteError }
              : w.step === 'done'
                ? { kind: 'success', text: 'Swap confirmed.' }
                : undefined
        }
      />
      {w.hash ? (
        <Button title="View on Etherscan" variant="secondary" onPress={() => Linking.openURL(`https://etherscan.io/tx/${w.hash}`)} />
      ) : null}

      <Button
        title={action}
        disabled={w.external.isConnected && (!w.canSwap || w.busy)}
        onPress={() => (w.external.isConnected ? w.swap() : router.push('/connect'))}
      />

      <TokenPicker
        visible={!!picking}
        exclude={picking === 'to' ? w.from : w.to}
        onClose={() => setPicking(undefined)}
        onPick={(t) => {
          if (picking === 'from') {
            if (t.symbol === w.to.symbol) w.setTo(w.from);
            w.setFrom(t);
          } else {
            if (t.symbol === w.from.symbol) w.setFrom(w.to);
            w.setTo(t);
          }
          setPicking(undefined);
        }}
      />
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
  dot: { alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#fff', fontWeight: '800' },
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
  slippage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slippageOptions: { flexDirection: 'row', gap: 8 },
  slip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  },
  slipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slipText: { color: colors.muted, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 4 },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  sheetSymbol: { color: colors.text, fontWeight: '700', fontSize: 16 },
  sheetName: { color: colors.muted, fontSize: 12 },
});
