import type { Request, Response } from 'express'

import { mg } from 'db'
import { log } from 'logging'
import { z } from 'zod'

import { CATEGORIES, TRANSACTION_SOURCES } from '@tejadev/shared'

import { check_budget_alert } from '../../services/budget-alert.ts'
import { throw_error } from '../../utils/throw-error.ts'

export const update_transaction_by_id = async (req: Request, res: Response) => {
  const { id } = req.params

  const body = body_schema.safeParse(req.body)

  if (!body.success) {
    throw_error(body.error.errors[0]?.message ?? 'Invalid request body', 400)
  }

  const transaction = await mg.Transaction.findOneAndUpdate(
    { _id: id, user_id: req.user._id.toString() },
    { $set: body.data },
    { new: true }
  )

  if (!transaction) {
    throw_error('Transaction not found', 404)
  }

  res.json({ message: 'Transaction updated' })

  // Re-check budget thresholds — editing amount up can cross 80%/100%
  check_budget_alert(req.user).catch((err) =>
    log.error({
      app: 'transactions',
      message: 'Budget alert check failed after update',
      meta: { err }
    })
  )
}

const body_schema = z.object({
  amount: z.number().min(0).optional(),
  description: z.string().trim().min(1).optional(),
  category: z.enum(CATEGORIES).optional(),
  note: z.string().trim().optional(),
  date: z.coerce.date().optional(),
  source: z.enum(TRANSACTION_SOURCES).optional()
})
