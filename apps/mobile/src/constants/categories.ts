export const CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'health',
  'shopping',
  'bills',
  'salary',
  'others',
] as const;

export type TCategory = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<TCategory, { icon: string; color: string }> =
  {
    food: { icon: '🍔', color: '#F97316' },
    transport: { icon: '🚗', color: '#3B82F6' },
    entertainment: { icon: '🎬', color: '#A855F7' },
    health: { icon: '💊', color: '#EF4444' },
    shopping: { icon: '🛍️', color: '#EC4899' },
    bills: { icon: '💡', color: '#EAB308' },
    salary: { icon: '💰', color: '#16A34A' },
    others: { icon: '📦', color: '#6B7280' },
  };

export const TRANSACTION_SOURCES = ['manual', 'voice', 'image'] as const;
export type TTransactionSource = (typeof TRANSACTION_SOURCES)[number];
