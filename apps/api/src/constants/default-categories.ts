export const DEFAULT_CATEGORY_SEEDS = [
  {
    key: 'food',
    name: 'Food',
    icon: 'food-fork-drink',
    color: '#F97316',
    bg: '#FFF7ED',
    is_deletable: true,
    is_income: false,
    sort_order: 1
  },
  {
    key: 'transport',
    name: 'Transport',
    icon: 'car-outline',
    color: '#3B82F6',
    bg: '#EFF6FF',
    is_deletable: true,
    is_income: false,
    sort_order: 2
  },
  {
    key: 'entertainment',
    name: 'Entertainment',
    icon: 'television-play',
    color: '#A855F7',
    bg: '#FAF5FF',
    is_deletable: true,
    is_income: false,
    sort_order: 3
  },
  {
    key: 'health',
    name: 'Health',
    icon: 'heart-pulse',
    color: '#EF4444',
    bg: '#FEF2F2',
    is_deletable: true,
    is_income: false,
    sort_order: 4
  },
  {
    key: 'shopping',
    name: 'Shopping',
    icon: 'shopping-outline',
    color: '#EC4899',
    bg: '#FDF2F8',
    is_deletable: true,
    is_income: false,
    sort_order: 5
  },
  {
    key: 'bills',
    name: 'Bills',
    icon: 'receipt',
    color: '#EAB308',
    bg: '#FEFCE8',
    is_deletable: true,
    is_income: false,
    sort_order: 6
  },
  {
    key: 'others',
    name: 'Others',
    icon: 'shape-outline',
    color: '#6B7280',
    bg: '#F9FAFB',
    is_deletable: false,
    is_income: false,
    sort_order: 99
  }
] as const
