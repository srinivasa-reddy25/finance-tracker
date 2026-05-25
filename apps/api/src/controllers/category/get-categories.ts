import type { Request, Response } from 'express'

import { mg } from 'db'

const DEFAULT_CATEGORIES = [
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
    key: 'salary',
    name: 'Salary',
    icon: 'cash-multiple',
    color: '#059669',
    bg: '#ECFDF5',
    is_deletable: true,
    is_income: true,
    sort_order: 7
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
]

export const get_categories = async (req: Request, res: Response) => {
  const user_id = req.user._id.toString()

  await mg.UserCategory.deleteMany({ user_id, key: { $exists: false } })

  const docs = DEFAULT_CATEGORIES.map((c) => ({
    user_id,
    key: c.key,
    name: c.name,
    icon: c.icon,
    color: c.color,
    bg: c.bg,
    is_deletable: c.is_deletable,
    is_income: c.is_income,
    sort_order: c.sort_order
  }))

  try {
    await mg.UserCategory.insertMany(docs, { ordered: false })
  } catch {
    // duplicate key errors are expected — ignore
  }

  const now = new Date()
  const month_start = new Date(now.getFullYear(), now.getMonth(), 1)
  const month_end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const spent_agg = await mg.Transaction.aggregate([
    {
      $match: {
        user_id,
        date: { $gte: month_start, $lt: month_end }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ])

  const spent_map = new Map<string, number>(
    spent_agg.map((s: { _id: string; total: number }) => [s._id, s.total])
  )

  const categories = await mg.UserCategory.find({ user_id })
    .sort({ sort_order: 1, createdAt: 1 })
    .lean()

  const result = categories.map((c) => ({
    ...c,
    spent: spent_map.get(c.key) ?? 0
  }))

  res.json({ message: 'Categories fetched', data: { categories: result } })
}
