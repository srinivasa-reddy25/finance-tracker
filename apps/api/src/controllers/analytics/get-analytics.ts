import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

export const get_analytics = async (req: Request, res: Response) => {
  const { month, tz } = query_schema.parse(req.query)
  const user_id = req.user._id.toString()

  const parts = month.split('-').map(Number)
  const year = parts[0] as number
  const mon = parts[1] as number

  const month_start = new Date(year, mon - 1, 1)
  const month_end = new Date(year, mon, 1)
  const prev_start = new Date(year, mon - 2, 1)
  const prev_end = new Date(year, mon - 1, 1)

  const [daily_agg, current_agg, prev_agg] = await Promise.all([
    // Spending per day — use device timezone so day numbers match local date
    mg.Transaction.aggregate([
      { $match: { user_id, date: { $gte: month_start, $lt: month_end } } },
      {
        $group: {
          _id: { $dayOfMonth: { date: '$date', timezone: tz } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Current month by category
    mg.Transaction.aggregate([
      { $match: { user_id, date: { $gte: month_start, $lt: month_end } } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } }
    ]),

    // Previous month by category
    mg.Transaction.aggregate([
      { $match: { user_id, date: { $gte: prev_start, $lt: prev_end } } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } }
    ])
  ])

  res.json({
    message: 'Analytics fetched',
    data: {
      daily: daily_agg.map((d) => ({
        day: d._id as number,
        amount: d.amount as number
      })),
      current_by_category: current_agg.map((c) => ({
        category: c._id as string,
        amount: c.amount as number
      })),
      prev_by_category: prev_agg.map((p) => ({
        category: p._id as string,
        amount: p.amount as number
      }))
    }
  })
}

const query_schema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM format')
    .default(() => new Date().toISOString().slice(0, 7)),
  tz: z.string().default('Asia/Kolkata')
})
