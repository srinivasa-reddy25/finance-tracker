import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';

import { api } from './api';

async function register_token(token: string): Promise<void> {
  await api.patch('/users/fcm-token', { token });
}

export async function request_notification_permission(): Promise<boolean> {
  const status = await requestPermission(getMessaging());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

export async function setup_notifications(): Promise<void> {
  const granted = await request_notification_permission();
  if (!granted) return;

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
