import { router, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAssets } from '../../controllers/useAssets';
import { useBitcoinUtxos } from '../../controllers/useBitcoinUtxos';
import { useExternalSigner } from '../../controllers/useWallet';
import { useHistory } from '../../controllers/useHistory';
import { usePrices } from '../../controllers/usePrices';
import { formatAssetAmount } from '../../models/assetAmounts';
import type { MarketCoinId } from '../../models/services/marketApi';
import { appKit } from '../../models/config/appkit';
import { bitcoinTxUrl } from '../../models/config/bitcoin';
import { getAsset } from '../../models/config/assets';
import { formatBtc, isValidMainnetBitcoinAddress } from '../../models/services/bitcoinService';
import { isValidSolanaAddress } from '../../models/services/solanaService';
import { saveWatchAddress } from '../../models/services/walletStorage';
import { shortAddress } from '../../models/format';
import { HistoryList } from '../components/HistoryList';
import { MiniPriceChart } from '../components/MiniPriceChart';
import { Button, Card, Field, Muted, Screen, colors } from '../components/ui';
import { ActionButton, CoinBadge } from '../components/wallet';

/** One coin: balance, Send / Receive / Swap, faucet and its history. */
export default function CoinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = getAsset(id);
  const { byId, loading, refresh, watchAddresses, refreshWatchAddress } = useAssets();
  const { getFiatValue, refresh: refreshPrices, loading: pricesLoading } = usePrices();
  const history = useHistory(asset?.id);
  const utxos = useBitcoinUtxos(asset?.id === 'btc');
  const external = useExternalSigner();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshPrices();
      if (history.refresh) history.refresh();
      if (utxos.refresh) utxos.refresh();
    }, [refresh, refreshPrices, history.refresh, utxos.refresh])
  );
  const [watchInput, setWatchInput] = useState('');
  const [watchError, setWatchError] = useState<string>();

  if (!asset) return <Screen><Muted>Unknown coin.</Muted></Screen>;
  const b = byId(asset.id);
  const marketCoin: MarketCoinId = asset.kind === 'bitcoin' ? 'btc' : asset.kind === 'solana' ? 'sol' : 'eth';
  const watchAddress = watchAddresses[asset.id];
  const needsWatchAddress = asset.readOnly && !watchAddress;

  const handleSend = () => {
    if (asset.mainnet && asset.kind === 'evm' && !external.isConnected) {
      appKit.open();
      return;
    }
    router.push({ pathname: '/send/[id]', params: { id: asset.id } });
  };

  return (
    <Screen
      refreshing={loading || history.loading || pricesLoading}
      onRefresh={() => {
        refresh();
        history.refresh();
        utxos.refresh();
        refreshPrices();
      }}
    >
      <Stack.Screen options={{ title: `${asset.name} (${asset.networkName})` }} />

      {needsWatchAddress ? (
        <Card title={`Watch a ${asset.name} mainnet address`}>
          <Muted>
            This app never holds a real {asset.name} key. Enter an address you already own elsewhere to view its
            balance and history.
          </Muted>
          <Field
            label={`${asset.name} address`}
            placeholder={asset.kind === 'bitcoin' ? 'bc1…' : 'Base58 address'}
            value={watchInput}
            onChangeText={(v) => {
              setWatchInput(v);
              setWatchError(undefined);
            }}
          />
          {watchError ? <Muted>{watchError}</Muted> : null}
          <Button
            title="Watch address"
            onPress={async () => {
              const value = watchInput.trim();
              const valid = asset.kind === 'bitcoin' ? isValidMainnetBitcoinAddress(value) : isValidSolanaAddress(value);
              if (!valid) {
                setWatchError(
                  asset.kind === 'bitcoin'
                    ? 'Enter a valid mainnet address (bc1…, 1… or 3…)'
                    : 'Enter a valid Solana address',
                );
                return;
              }
              await saveWatchAddress(asset.id, value);
              await refreshWatchAddress();
              refresh();
              history.refresh();
            }}
          />
        </Card>
      ) : (
        <View style={s.hero}>
          <CoinBadge asset={asset} size={64} />
          <Text style={s.balance} numberOfLines={1} adjustsFontSizeToFit>
            {b?.balance !== undefined ? `${formatAssetAmount(asset, b.balance, 8)} ${asset.symbol}` : (b?.error ?? '…')}
          </Text>
          {b?.balance !== undefined ? (
            <Text style={s.fiatBalance}>≈ {getFiatValue(asset.id, b.balance)}</Text>
          ) : null}
          {b?.pending ? (
            <Muted>{`Pending: ${formatAssetAmount(asset, b.pending, 8)} ${asset.symbol}`}</Muted>
          ) : null}
          <Text style={s.address}>{shortAddress(b?.address, 8)}</Text>
        </View>
      )}

      <MiniPriceChart
        coinId={marketCoin}
        onPress={() => router.push({ pathname: '/coin-market/[id]', params: { id: asset.id } })}
      />

      {!asset.readOnly ? (
        <View style={s.actions}>
          <ActionButton icon="arrow-up" label="Send" onPress={handleSend} />
          <ActionButton
            icon="arrow-down"
            label="Receive"
            onPress={() => router.push({ pathname: '/receive/[id]', params: { id: asset.id } })}
          />
          <ActionButton icon="swap-horizontal" label="Swap" onPress={() => router.push('/swap')} />
        </View>
      ) : null}

      {asset.kind !== 'solana' ? (
        <Button
          title={asset.mainnet ? `Buy ${asset.symbol}` : `Buy / Sell ${asset.name}`}
          variant="secondary"
          onPress={() => router.push({ pathname: '/buy-sell', params: { mode: 'buy' } })}
        />
      ) : null}

      {asset.faucetUrl ? (
        <Button
          title={`Get free ${asset.symbol} (faucet)`}
          variant="secondary"
          onPress={() => Linking.openURL(asset.faucetUrl!)}
        />
      ) : null}

      {asset.id === 'btc' ? (
        <Card title={`UTXOs${utxos.utxos ? ` (${utxos.utxos.length})` : ''}`}>
          {utxos.error ? <Muted>{utxos.error}</Muted> : null}
          {utxos.utxos?.length === 0 ? <Muted>No unspent outputs yet.</Muted> : null}
          {utxos.utxos?.map((u) => (
            <Pressable key={`${u.txid}:${u.vout}`} onPress={() => Linking.openURL(bitcoinTxUrl(u.txid))} style={s.utxo}>
              <Text style={s.utxoId} numberOfLines={1}>{`${u.txid.slice(0, 10)}…${u.txid.slice(-6)}:${u.vout}`}</Text>
              <Text style={s.utxoValue}>{`${formatBtc(u.value)} ${asset.symbol}${u.confirmed ? '' : ' · pending'}`}</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card title="History">
        <HistoryList
          items={history.items}
          emptyText={
            asset.kind === 'bitcoin' || asset.kind === 'solana'
              ? 'No transactions yet.'
              : 'No transactions sent from this app yet. (Incoming ETH shows in your balance.)'
          }
        />
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  balance: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 6 },
  fiatBalance: { color: colors.muted, fontSize: 16, fontWeight: '600', marginTop: -4 },
  address: { color: colors.muted, fontFamily: 'monospace', fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  marketRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  marketLabel: { color: colors.muted, fontSize: 14 },
  marketValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  utxo: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  utxoId: { color: colors.muted, fontFamily: 'monospace', fontSize: 12, flex: 1 },
  utxoValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
