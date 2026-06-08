export const CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'health',
  'shopping',
  'bills',
  'others',
] as const;

export type TCategory = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<
  TCategory,
  { icon: string; color: string; bg: string }
> = {
  food: { icon: 'food-fork-drink', color: '#DA8400', bg: '#FAF0DB' },
  transport: { icon: 'car-outline', color: '#2F6BE2', bg: '#E8EFFD' },
  entertainment: { icon: 'television-play', color: '#7C5CFF', bg: '#EEEAFF' },
  health: { icon: 'heart-pulse', color: '#E0484D', bg: '#FBEAEB' },
  shopping: { icon: 'shopping-outline', color: '#D6308C', bg: '#FAE6F1' },
  bills: { icon: 'receipt', color: '#0E9F8E', bg: '#E0F4F1' },
  others: { icon: 'shape-outline', color: '#7A746B', bg: '#EFEDE7' },
};

export const EXPENSE_CATEGORIES: TCategory[] = [
  'food',
  'transport',
  'entertainment',
  'health',
  'shopping',
  'bills',
  'others',
];

export const TRANSACTION_SOURCES = ['manual', 'voice', 'image'] as const;
export type TTransactionSource = (typeof TRANSACTION_SOURCES)[number];
