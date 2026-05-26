export type TRecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type TRecurringTransaction = {
  _id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  frequency: TRecurrenceFrequency;
  day_of_month?: number;
  day_of_week?: number;
  month_of_year?: number;
  description?: string;
  is_active: boolean;
  next_run: string;
  last_run?: string;
  createdAt: string;
};

export type TCreateRecurring = {
  name: string;
  amount: number;
  category: string;
  frequency: TRecurrenceFrequency;
  day_of_month?: number;
  day_of_week?: number;
  month_of_year?: number;
  description?: string;
};

export type TRecurringRun = {
  _id: string;
  recurring_id: string;
  user_id: string;
  status: 'success' | 'failed';
  fired_at: string;
  transaction_id?: string;
  error?: string;
  amount: number;
  name: string;
};

export const DAY_NAMES = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;
export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;
