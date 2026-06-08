export const DEFAULT_CATEGORY_SEEDS = [
  {
    key: 'food',
    name: 'Food & Dining',
    icon: 'food-fork-drink',
    color: '#DA8400',
    bg: '#FAF0DB',
    is_deletable: true,
    is_income: false,
    sort_order: 1
  },
  {
    key: 'transport',
    name: 'Transport',
    icon: 'car-outline',
    color: '#2F6BE2',
    bg: '#E8EFFD',
    is_deletable: true,
    is_income: false,
    sort_order: 2
  },
  {
    key: 'entertainment',
    name: 'Entertainment',
    icon: 'television-play',
    color: '#7C5CFF',
    bg: '#EEEAFF',
    is_deletable: true,
    is_income: false,
    sort_order: 3
  },
  {
    key: 'health',
    name: 'Health',
    icon: 'heart-pulse',
    color: '#E0484D',
    bg: '#FBEAEB',
    is_deletable: true,
    is_income: false,
    sort_order: 4
  },
  {
    key: 'shopping',
    name: 'Shopping',
    icon: 'shopping-outline',
    color: '#D6308C',
    bg: '#FAE6F1',
    is_deletable: true,
    is_income: false,
    sort_order: 5
  },
  {
    key: 'bills',
    name: 'Bills & Utilities',
    icon: 'receipt',
    color: '#0E9F8E',
    bg: '#E0F4F1',
    is_deletable: true,
    is_income: false,
    sort_order: 6
  },
  {
    key: 'others',
    name: 'Others',
    icon: 'shape-outline',
    color: '#7A746B',
    bg: '#EFEDE7',
    is_deletable: false,
    is_income: false,
    sort_order: 99
  }
] as const
