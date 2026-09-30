import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native';
import { Linking } from 'react-native';

import { REOWN_PROJECT_ID } from '../../models/config/env';
import { shortAddress } from '../../models/format';
import { Button, Card, Muted, Row, Screen } from '../components/ui';

/** External wallets (MetaMask / Trust Wallet) over WalletConnect. The built-in wallet doesn't need this. */
export default function ConnectScreen() {
  const { address, isConnected, chain } = useAccount();
  const { open, disconnect } = useAppKit();
  const { walletInfo } = useWalletInfo();

  if (!REOWN_PROJECT_ID) {
    return (
      <Screen>
        <Card title="WalletConnect not set up">
          <Muted>
            {'Your built-in wallet already works without this. To also connect MetaMask / Trust Wallet, ' +
              'create a free project at dashboard.reown.com, put its Project ID in mobile/.env ' +
              '(EXPO_PUBLIC_REOWN_PROJECT_ID), then restart "npx expo start --clear".'}
          </Muted>
          <Button title="Open Reown dashboard" variant="secondary" onPress={() => Linking.openURL('https://dashboard.reown.com')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card title={isConnected ? 'External wallet connected' : 'Connect external wallet'}>
        {isConnected ? (
          <>
            <Row label="Wallet" value={walletInfo?.name ?? 'WalletConnect'} />
            <Row label="Address" value={shortAddress(address, 6)} mono />
            <Row label="Network" value={chain?.name ?? '—'} />
            <Button title="Account details" variant="secondary" onPress={() => open({ view: 'Account' })} />
            <Button title="Disconnect" variant="danger" onPress={() => disconnect()} />
          </>
        ) : (
          <>
            <Muted>Pick MetaMask or Trust Wallet. The wallet app opens, asks you to approve, then returns here.</Muted>
            <Button title="Connect Wallet" onPress={() => open()} />
          </>
        )}
      </Card>
    </Screen>
  );
}
