import type { Request, Response } from 'express'

import { mg } from 'db'

export const get_monthly_summary = async (req: Request, res: Response) => {
  const user_id = req.user._id.toString()
  const now = new Date()

  // Previous month
  const prev_month = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const prev_year =
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const prev_start = new Date(prev_year, prev_month, 1)
  const prev_end = new Date(prev_year, prev_month + 1, 1)

  // Two months ago (for comparison)
  const two_month = prev_month === 0 ? 11 : prev_month - 1
  const two_year = prev_month === 0 ? prev_year - 1 : prev_year
  const two_start = new Date(two_year, two_month, 1)
  const two_end = new Date(prev_year, prev_month, 1)

  const lookup_pipeline = {
    $lookup: {
      from: 'usercategories',
      let: { cat_key: '$category', uid: '$user_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$key', '$$cat_key'] },
                { $eq: ['$user_id', '$$uid'] }
              ]
            }
          }
        }
      ],
      as: 'cat'
    }
  }

  const [by_category, biggest, prev_total_agg, two_total_agg] =
    await Promise.all([
      // Spending by category last month
      mg.Transaction.aggregate([
        { $match: { user_id, date: { $gte: prev_start, $lt: prev_end } } },
        lookup_pipeline,
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $match: { 'cat.is_income': { $ne: true } } },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
            name: { $first: '$cat.name' },
            color: { $first: '$cat.color' },
            icon: { $first: '$cat.icon' }
          }
        },
        { $sort: { amount: -1 } }
      ]),
      // Biggest single transaction last month
      mg.Transaction.aggregate([
        { $match: { user_id, date: { $gte: prev_start, $lt: prev_end } } },
        lookup_pipeline,
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $match: { 'cat.is_income': { $ne: true } } },
        { $sort: { amount: -1 } },
        { $limit: 1 }
      ]),
      // Total last month
      mg.Transaction.aggregate([
        { $match: { user_id, date: { $gte: prev_start, $lt: prev_end } } },
        lookup_pipeline,
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $match: { 'cat.is_income': { $ne: true } } },
        {
          $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } }
        }
      ]),
      // Total two months ago
      mg.Transaction.aggregate([
        { $match: { user_id, date: { $gte: two_start, $lt: two_end } } },
        lookup_pipeline,
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $match: { 'cat.is_income': { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ])

  const total_spent = prev_total_agg[0]?.total ?? 0
  const tx_count = prev_total_agg[0]?.count ?? 0
  const prev_two_spent = two_total_agg[0]?.total ?? 0

  // No transactions last month — nothing to show
  if (tx_count === 0) {
    res.json({ message: 'No data', data: null })
    return
  }

  const pct_change =
    prev_two_spent > 0
      ? Math.round(((total_spent - prev_two_spent) / prev_two_spent) * 100)
      : null

  res.json({
    message: 'Monthly summary fetched',
    data: {
      month_label: prev_start.toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric'
      }),
      total_spent,
      tx_count,
      pct_change,
      top_categories: by_category.slice(0, 3).map((c: any) => ({
        key: c._id,
        name: c.name || c._id,
        amount: c.amount,
        color: c.color || '#6B7280',
        icon: c.icon || 'shape-outline'
      })),
      biggest: biggest[0]
        ? {
            description: biggest[0].description as string,
            amount: biggest[0].amount as number,
            category: biggest[0].cat?.name ?? biggest[0].category
          }
        : null
    }
  })
}
