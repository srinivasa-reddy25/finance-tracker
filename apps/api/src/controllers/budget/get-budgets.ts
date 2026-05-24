import type { Request, Response } from 'express'

import { mg } from 'db'

export const get_budgets = async (req: Request, res: Response) => {
  const user_id = req.user.firebase_uid
  const now = new Date()
  const month_start = new Date(now.getFullYear(), now.getMonth(), 1)
  const month_end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [budgets, spending] = await Promise.all([
    mg.Budget.find({ user_id }).lean(),
    mg.Transaction.aggregate([
      {
        $match: {
          user_id,
          date: { $gte: month_start, $lt: month_end },
          category: { $ne: 'salary' }
        }
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ])
  ])

  const spending_map = new Map(
    spending.map((s: { _id: string; total: number }) => [s._id, s.total])
  )

  // Total of all non-salary spending this month (used for the overall budget)
  const total_spent = spending.reduce(
    (sum: number, s: { _id: string; total: number }) => sum + s.total,
    0
  )

  const result = budgets.map((b) => {
    const spent =
      b.category === '__overall__'
        ? total_spent
        : ((spending_map.get(b.category) ?? 0) as number)
    return {
      ...b,
      spent,
      percentage: Math.round((spent / b.amount) * 100)
    }
  })

  res.json({ message: 'Budgets fetched', data: { budgets: result } })
}
