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

async function register_token(token: string): Promise<void> {
  await api.patch('/users/fcm-token', { token });
}

export async function is_notification_granted(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    return PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
  return true;
}

export async function has_asked_permission(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_ASKED_KEY);
  return val === 'true';
}

export async function request_and_register(): Promise<boolean> {
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

  if (granted) await register_notifications();
  return granted;
}

export async function register_notifications(): Promise<void> {
  const token = await getToken(getMessaging());
  if (token) {
    await register_token(token).catch(() => {});
  }
  onTokenRefresh(getMessaging(), new_token => {
    register_token(new_token).catch(() => {});
  });
  onMessage(getMessaging(), _remoteMessage => {});
}

export async function cleanup_notifications(): Promise<void> {
  try {
    await api.patch('/users/fcm-token', { token: '' });
  } catch {}
}
