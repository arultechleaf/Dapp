import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useExternalSigner } from '../../controllers/useWallet';
import { useWalletStore } from '../../controllers/WalletStore';
import { assetAddress } from '../../models/assetAmounts';
import { appKit } from '../../models/config/appkit';
import { getAsset } from '../../models/config/assets';
import { Button, Muted, Screen, colors } from '../components/ui';
import { CoinBadge } from '../components/wallet';

/** Receive a coin: QR code, address, copy/share, faucet. */
export default function ReceiveCoinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = getAsset(id);
  const { active } = useWalletStore();
  const external = useExternalSigner();
  const [copied, setCopied] = useState(false);

  if (!asset) return <Screen><Muted>Unknown coin.</Muted></Screen>;
  if (asset.readOnly) {
    return (
      <Screen>
        <Stack.Screen options={{ title: `Receive ${asset.symbol}` }} />
        <Muted>This coin is watch-only — there's no deposit address to receive into here.</Muted>
      </Screen>
    );
  }
  if (!active) return <Screen><ActivityIndicator color={colors.muted} /></Screen>;

  // Real funds: this app never custodies a mainnet key, so it can only show the
  // address of a wallet you've connected yourself — never the in-app address.
  if (asset.mainnet && asset.kind === 'evm') {
    if (!external.isConnected || !external.address) {
      return (
        <Screen>
          <Stack.Screen options={{ title: `Receive ${asset.symbol}` }} />
          <Muted>Connect an external wallet to see your real {asset.symbol} receive address.</Muted>
          <Button title="Connect wallet" onPress={() => appKit.open()} />
        </Screen>
      );
    }
    const address = external.address;
    const uri = `ethereum:${address}@${asset.chain.id}`;
    return (
      <Screen>
        <Stack.Screen options={{ title: `Receive ${asset.symbol}` }} />
        <View style={s.head}>
          <CoinBadge asset={asset} size={36} />
          <Text style={s.headTitle}>{`${asset.name} · ${asset.networkName}`}</Text>
        </View>
        <View style={s.qrCard}>
          <View style={s.qr}>
            <QRCode value={uri} size={220} />
          </View>
          <Text style={s.address} selectable>
            {address}
          </Text>
        </View>
        <Muted>{`Only send ${asset.symbol} on ${asset.name} ${asset.networkName} to this address.`}</Muted>
        <Button
          title={copied ? 'Copied!' : 'Copy address'}
          onPress={async () => {
            await Clipboard.setStringAsync(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        />
        <Button title="Share" variant="secondary" onPress={() => Share.share({ message: address })} />
      </Screen>
    );
  }

  const address = assetAddress(asset, active.keys.address, active.btcAddress, active.solAddress);
  const uri =
    asset.kind === 'bitcoin'
      ? `bitcoin:${address}`
      : asset.kind === 'evm'
        ? `ethereum:${address}@${asset.chain.id}`
        : `solana:${address}`;

  return (
    <Screen>
      <Stack.Screen options={{ title: `Receive ${asset.symbol}` }} />
      <View style={s.head}>
        <CoinBadge asset={asset} size={36} />
        <Text style={s.headTitle}>{`${asset.name} · ${asset.networkName}`}</Text>
      </View>

      <View style={s.qrCard}>
        <View style={s.qr}>
          <QRCode value={uri} size={220} />
        </View>
        <Text style={s.address} selectable>
          {address}
        </Text>
      </View>

      <Muted>{`Only send ${asset.symbol} on ${asset.name} ${asset.networkName} to this address.`}</Muted>

      <Button
        title={copied ? 'Copied!' : 'Copy address'}
        onPress={async () => {
          await Clipboard.setStringAsync(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      />
      <Button title="Share" variant="secondary" onPress={() => Share.share({ message: address })} />
      {asset.faucetUrl ? (
        <Button
          title={`Get free ${asset.symbol} (faucet)`}
          variant="secondary"
          onPress={() => Linking.openURL(asset.faucetUrl!)}
        />
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  headTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  qrCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, alignItems: 'center', gap: 16 },
  qr: { backgroundColor: '#fff', padding: 14, borderRadius: 14 },
  address: { color: colors.text, fontFamily: 'monospace', fontSize: 13, textAlign: 'center' },
});
