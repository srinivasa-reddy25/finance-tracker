import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

import { api } from './api';

const NOTIF_ASKED_KEY = 'notif_permission_asked';

async function registerToken(token: string): Promise<void> {
  await api.patch('/users/fcm-token', { token });
}

export async function isNotificationGranted(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    return PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
  // iOS: check actual authorization status
  const status = await requestPermission(getMessaging());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

export async function hasAskedPermission(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_ASKED_KEY);
  return val === 'true';
}

export async function requestAndRegister(): Promise<boolean> {
  await AsyncStorage.setItem(NOTIF_ASKED_KEY, 'true');

  let granted = false;

  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      granted = result === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      granted = true;
    }
  } else {
    const status = await requestPermission(getMessaging());
    granted =
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL;
  }

  if (granted) await registerNotifications();
  return granted;
}

export async function registerNotifications(): Promise<void> {
  const token = await getToken(getMessaging());
  if (token) {
    await registerToken(token).catch(() => {});
  }
  onTokenRefresh(getMessaging(), newToken => {
    registerToken(newToken).catch(() => {});
  });
  // Listen for foreground messages (can be extended to show in-app banners)
  onMessage(getMessaging(), _remoteMessage => {});
}

export async function cleanupNotifications(): Promise<void> {
  try {
    await api.patch('/users/fcm-token', { token: '' });
  } catch {
    // Best-effort cleanup — ignore errors on sign-out
  }
}
