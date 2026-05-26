import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import {
  CATEGORIES,
  compute_next_run,
  RECURRENCE_FREQUENCIES
} from '@tejadev/shared'

import CustomError from '../../utils/CustomError.ts'
import { throw_error } from '../../utils/throw-error.ts'

export const update_recurring = async (req: Request, res: Response) => {
  const { id } = req.params
  const body = body_schema.safeParse(req.body)
  if (!body.success)
    throw_error(body.error.errors[0]?.message ?? 'Invalid body', 400)

  const user_id = req.user._id.toString()
  const doc = await mg.RecurringTransaction.findOne({ _id: id, user_id })
  if (!doc) throw new CustomError('Recurring transaction not found', 404)

  const updates = body.data!
  Object.assign(doc, updates)

  // Recompute next_run if scheduling changed
  const sched_changed =
    updates.frequency ||
    updates.day_of_month !== undefined ||
    updates.day_of_week !== undefined ||
    updates.month_of_year !== undefined
  if (sched_changed) {
    doc.next_run = compute_next_run(doc.frequency, {
      day_of_month: doc.day_of_month,
      day_of_week: doc.day_of_week,
      month_of_year: doc.month_of_year
    })
  }

  await doc.save()
  res.json({ message: 'Recurring transaction updated' })
}

const body_schema = z.object({
  name: z.string().min(1).max(60).optional(),
  amount: z.number().positive().optional(),
  category: z.enum(CATEGORIES).optional(),
  frequency: z.enum(RECURRENCE_FREQUENCIES).optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  day_of_week: z.number().int().min(0).max(6).optional(),
  month_of_year: z.number().int().min(1).max(12).optional(),
  description: z.string().max(200).optional(),
  is_active: z.boolean().optional()
})
