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
  food: { icon: 'food-fork-drink', color: '#F97316', bg: '#FFF7ED' },
  transport: { icon: 'car-outline', color: '#3B82F6', bg: '#EFF6FF' },
  entertainment: { icon: 'television-play', color: '#A855F7', bg: '#FAF5FF' },
  health: { icon: 'heart-pulse', color: '#EF4444', bg: '#FEF2F2' },
  shopping: { icon: 'shopping-outline', color: '#EC4899', bg: '#FDF2F8' },
  bills: { icon: 'receipt', color: '#EAB308', bg: '#FEFCE8' },
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
