import { NativeModules, Platform } from 'react-native';

type WidgetData = {
  todaySpent: number;
  monthlySpent: number;
  budget: number;
  currency?: string;
};

export function updateWidget(data: WidgetData) {
  if (Platform.OS !== 'android') return;
  NativeModules.WidgetModule?.updateWidget({
    ...data,
    currency: data.currency ?? '₹',
  });
}
