import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secrets (recovery phrases, PIN hash) go to the OS keystore via expo-secure-store
 * (Android Keystore / iOS Keychain). The web build has no keystore, so it falls
 * back to AsyncStorage — fine for UI testing, not for real secrets.
 */
const isWeb = Platform.OS === 'web';

export async function getSecret(key: string): Promise<string | null> {
  return isWeb ? AsyncStorage.getItem(`secure.${key}`) : SecureStore.getItemAsync(key);
}

export async function setSecret(key: string, value: string): Promise<void> {
  if (isWeb) await AsyncStorage.setItem(`secure.${key}`, value);
  else await SecureStore.setItemAsync(key, value);
}

export async function deleteSecret(key: string): Promise<void> {
  if (isWeb) await AsyncStorage.removeItem(`secure.${key}`);
  else await SecureStore.deleteItemAsync(key);
}
