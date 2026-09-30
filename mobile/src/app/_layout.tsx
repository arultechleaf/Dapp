import { AppKit, AppKitProvider } from '@reown/appkit-react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WalletStoreProvider, useWalletStore } from '../controllers/WalletStore';
import { appKit } from '../models/config/appkit';
import { colors } from '../views/components/ui';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppKitProvider instance={appKit}>
        <WalletStoreProvider>
          <StatusBar style="light" />
          <View style={s.outer}>
            <View style={s.container}>
              <RootNavigator />
            </View>
          </View>
        </WalletStoreProvider>
        {/* AppKit connect modal; absolutely positioned so it overlays the navigator on Android */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <AppKit />
        </View>
      </AppKitProvider>
    </SafeAreaProvider>
  );
}

/**
 * Routes are gated by wallet status:
 *   empty    → onboarding (welcome, PIN, backup/verify or import)
 *   locked   → PIN unlock
 *   unlocked → dashboard and everything else
 */
function RootNavigator() {
  const { status } = useWalletStore();

  if (status === 'loading') {
    return (
      <View style={s.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={status === 'unlocked'}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="coin/[id]" options={{ title: '' }} />
        <Stack.Screen name="select-coin" options={{ title: 'Choose coin' }} />
        <Stack.Screen name="send/[id]" options={{ title: 'Send' }} />
        <Stack.Screen name="receive/[id]" options={{ title: 'Receive' }} />
        <Stack.Screen name="swap" options={{ title: 'Swap' }} />
        <Stack.Screen name="history" options={{ title: 'History' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="phrase" options={{ title: 'Recovery phrase' }} />
        <Stack.Screen name="change-pin" options={{ title: 'Change PIN' }} />
        <Stack.Screen name="contract" options={{ title: 'Contract Functions' }} />
        <Stack.Screen name="connect" options={{ title: 'External wallet' }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'empty'}>
        <Stack.Screen name="onboarding/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/pin" options={{ title: '' }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'empty' || status === 'unlocked'}>
        <Stack.Screen name="onboarding/backup" options={{ title: 'Back up wallet' }} />
        <Stack.Screen name="onboarding/verify" options={{ title: 'Verify' }} />
        <Stack.Screen name="onboarding/import" options={{ title: 'Recover wallet' }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'locked'}>
        <Stack.Screen name="unlock" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  outer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#01050F' : colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    height: '100%',
    backgroundColor: colors.bg,
    ...(Platform.OS === 'web'
      ? {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
          boxShadow: '0 0 50px rgba(0, 119, 230, 0.15), 0 20px 60px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden' as const,
        }
      : {}),
  },
});
