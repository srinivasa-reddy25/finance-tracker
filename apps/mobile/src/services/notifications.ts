import { PermissionsAndroid, Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
} from '@react-native-firebase/messaging';

import { api } from './api';

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
