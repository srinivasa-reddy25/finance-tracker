export const CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'health',
  'shopping',
  'bills',
  'salary',
  'others'
] as const

export type TCategory = (typeof CATEGORIES)[number]

export const CATEGORY_ICONS: Record<TCategory, string> = {
  food: '🍔',
  transport: '🚗',
  entertainment: '🎬',
  health: '💊',
  shopping: '🛍️',
  bills: '💡',
  salary: '💰',
  others: '📦'
}

export const TRANSACTION_SOURCES = ['manual', 'voice', 'image'] as const
export type TTransactionSource = (typeof TRANSACTION_SOURCES)[number]
