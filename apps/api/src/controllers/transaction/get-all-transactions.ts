import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import { CATEGORIES } from '@tejadev/shared'

export const get_all_transactions = async (req: Request, res: Response) => {
  const query = query_schema.parse(req.query)

  const filter: Record<string, unknown> = { user_id: req.user.firebase_uid }

  if (query.category) filter.category = query.category

  if (query.month) {
    const parts = query.month.split('-').map(Number)
    const year = parts[0] as number
    const month = parts[1] as number
    filter.date = {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1)
    }
  }

  const limit = query.limit
  const skip = (query.page - 1) * limit

  const [transactions, total] = await Promise.all([
    mg.Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    mg.Transaction.countDocuments(filter)
  ])

  res.json({
    message: 'Transactions fetched',
    data: {
      transactions,
      pagination: {
        total,
        page: query.page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    }
  })
}

const query_schema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.enum(CATEGORIES).optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format')
    .optional()
})
