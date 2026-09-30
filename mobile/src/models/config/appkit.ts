import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import { createAppKit } from '@reown/appkit-react-native';
import * as Clipboard from 'expo-clipboard';

import { REOWN_PROJECT_ID } from './env';
import { networks, sepolia } from './networks';
import { appKitStorage } from './storage';

if (!REOWN_PROJECT_ID) {
  console.warn('EXPO_PUBLIC_REOWN_PROJECT_ID is not set - wallet connections will fail. See .env.example');
}

export const appKit = createAppKit({
  projectId: REOWN_PROJECT_ID,
  networks,
  defaultNetwork: sepolia,
  adapters: [new EthersAdapter()],
  storage: appKitStorage,
  metadata: {
    name: 'Dapp New',
    description: 'React Native dApp: wallet, balance, transfers and contract calls',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://reown.com/appkit',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
    redirect: { native: 'dappnew://' },
  },
  // MetaMask and Trust Wallet shown first in the connect modal
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
  clipboardClient: {
    setString: async (value: string) => {
      await Clipboard.setStringAsync(value);
    },
  },
  features: { swaps: false, onramp: false },
});
