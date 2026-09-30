import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Asks the OS for notification permission. Returns true when granted. No-op (false) on web. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
