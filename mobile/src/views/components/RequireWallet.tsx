import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';

import { useWallet } from '../../controllers/useWallet';
import { networks } from '../../models/config/networks';
import { Button, Card, Muted, Screen, colors } from './ui';

/** Renders children once the active wallet is ready on a supported network. */
export function RequireWallet({ children }: { children: ReactNode }) {
  const { isConnected, isSupportedNetwork, switchNetwork } = useWallet();

  if (!isConnected) {
    // The built-in wallet is always present when unlocked; its keys take a moment to derive.
    return (
      <Screen>
        <ActivityIndicator color={colors.muted} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!isSupportedNetwork) {
    return (
      <Screen>
        <Card title="Unsupported network">
          <Muted>Switch to one of the test networks below.</Muted>
          {networks.map((n) => (
            <Button key={n.id} title={`Switch to ${n.name}`} variant="secondary" onPress={() => switchNetwork(n)} />
          ))}
        </Card>
      </Screen>
    );
  }

  return <>{children}</>;
}
