import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

export const upsert_budget = async (req: Request, res: Response) => {
  const { category } = req.params
  const { amount } = body_schema.parse(req.body)

  const budget = await mg.Budget.findOneAndUpdate(
    { user_id: req.user.firebase_uid, category },
    { amount },
    { upsert: true, new: true }
  )

  res.json({ message: 'Budget saved', data: { budget_id: budget._id } })
}

const body_schema = z.object({
  amount: z
    .number({ required_error: 'Amount is required' })
    .min(1, 'Amount must be at least 1')
})
