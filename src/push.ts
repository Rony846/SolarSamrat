import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerPushToken, removePushToken } from './api/auth';

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function easProjectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

async function getExpoToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // push only works on physical devices
  const projectId = easProjectId();
  const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return tokenData.data || null;
}

/** Request permission, get the Expo push token, register it with the backend. */
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Chat & alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F4B740',
      });
    }
    const token = await getExpoToken();
    if (token) await registerPushToken(token, Platform.OS);
  } catch {
    // Non-fatal — the app works without push.
  }
}

/** Best-effort token removal on sign-out (called while still authenticated). */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await getExpoToken();
    if (token) await removePushToken(token);
  } catch {
    // Ignore — Expo prunes dead tokens server-side.
  }
}
