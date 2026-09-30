import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storage } from '@reown/appkit-react-native';

function parse<T>(value: string | null): T | undefined {
  if (value === null) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/** AsyncStorage-backed persistence for AppKit sessions. */
export const appKitStorage: Storage = {
  async getKeys() {
    return [...(await AsyncStorage.getAllKeys())];
  },
  async getEntries<T = any>() {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    return entries.map(([key, value]) => [key, parse<T>(value) as T] as [string, T]);
  },
  async getItem<T = any>(key: string) {
    return parse<T>(await AsyncStorage.getItem(key));
  },
  async setItem<T = any>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};
