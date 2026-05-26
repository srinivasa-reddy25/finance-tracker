import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

import { api } from './api';

async function register_token(token: string): Promise<void> {
  await api.patch('/users/fcm-token', { token });
}

export async function request_notification_permission(): Promise<boolean> {
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function setup_notifications(): Promise<void> {
  const granted = await request_notification_permission();
  if (!granted) return;

  const token = await messaging().getToken();
  if (token) {
    await register_token(token).catch(() => {});
  }

  messaging().onTokenRefresh(new_token => {
    register_token(new_token).catch(() => {});
  });

  if (Platform.OS === 'android') {
    await messaging().android.createChannel({
      id: 'finance_tracker_default',
      name: 'Finance Tracker',
      importance: 4,
    });
  }
}

export async function cleanup_notifications(): Promise<void> {
  try {
    await api.patch('/users/fcm-token', { token: '' });
  } catch {}
}

messaging().setBackgroundMessageHandler(async _remoteMessage => {});
