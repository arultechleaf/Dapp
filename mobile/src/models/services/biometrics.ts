import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** True when the device has biometrics (fingerprint / face) enrolled. Always false on web. */
export async function biometricsAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** Shows the system biometric prompt. Resolves true only when the user was verified. */
export async function authenticateBiometric(reason: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
