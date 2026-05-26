import type { Request, Response } from 'express'

import { mg } from 'db'
import { log } from 'logging'
import { z } from 'zod'

import { budget_alert_template } from '@tejadev/email'
import { TRANSACTION_SOURCES } from '@tejadev/shared'

import { send_email } from '../../services/email.ts'
import { throw_error } from '../../utils/throw-error.ts'

export const create_transaction = async (req: Request, res: Response) => {
  const body = body_schema.safeParse(req.body)

  if (!body.success) {
    throw_error(body.error.errors[0]?.message ?? 'Invalid request body', 400)
  }

  const transaction = await mg.Transaction.create({
    ...body.data,
    user_id: req.user._id.toString()
  })

  res.status(201).json({
    message: 'Transaction created',
    data: { transaction_id: transaction._id }
  })

  // Fire-and-forget budget alert check — never blocks the response
  check_budget_alert(req.user, body.data!.amount).catch((err) =>
    log.error({
      app: 'transactions',
      message: 'Budget alert check failed',
      meta: { err }
    })
  )
}

async function check_budget_alert(
  user: Express.Request['user'],
  new_amount: number
): Promise<void> {
  const user_id = user._id.toString()

  const [categories, agg] = await Promise.all([
    mg.UserCategory.find({
      user_id,
      is_income: false,
      budget: { $gt: 0 }
    }).lean(),
    mg.Transaction.aggregate([
      {
        $match: {
          user_id,
          date: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lt: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            )
          }
        }
      },
      {
        $lookup: {
          from: 'usercategories',
          localField: 'category',
          foreignField: 'key',
          as: 'cat'
        }
      },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $match: { 'cat.is_income': { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ])

  const total_budget = categories.reduce((s, c) => s + (c.budget ?? 0), 0)
  if (total_budget === 0) return

  const new_total = agg[0]?.total ?? 0
  const prev_total = new_total - new_amount

  const t80 = total_budget * 0.8

  if (prev_total < t80 && new_total >= t80 && new_total < total_budget) {
    const { subject, html } = budget_alert_template(
      user.name,
      new_total,
      total_budget,
      80
    )
    await send_email(user.email, subject, html)
  } else if (prev_total < total_budget && new_total >= total_budget) {
    const { subject, html } = budget_alert_template(
      user.name,
      new_total,
      total_budget,
      100
    )
    await send_email(user.email, subject, html)
  }
}

const body_schema = z.object({
  amount: z
    .number({ required_error: 'Amount is required' })
    .min(0, 'Amount must be positive'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description is required'),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required'),
  note: z.string().trim().optional(),
  date: z.coerce.date().optional(),
  source: z.enum(TRANSACTION_SOURCES).default('manual')
})
