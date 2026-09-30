import { hardhatLocal, sepolia } from '../models/config/networks';
import { useWalletStore } from './WalletStore';

/** Networks the in-app wallet can use for EVM dApps (testnets only). */
export const IN_APP_NETWORKS = [sepolia, hardhatLocal];

/**
 * Adapter over the wallet store for EVM dApp code (useWallet, Contract Functions):
 * the active wallet's keys plus the network those screens should use.
 */
export function useInAppWallet() {
  const store = useWalletStore();
  return {
    keys: store.status === 'unlocked' ? store.active?.keys : undefined,
    network: store.dappNetwork,
    setNetwork: store.setDappNetwork,
    disconnect: store.lock,
  };
}
