import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import {
  CATEGORIES,
  compute_next_run,
  RECURRENCE_FREQUENCIES
} from '@tejadev/shared'

import { throw_error } from '../../utils/throw-error.ts'

export const create_recurring = async (req: Request, res: Response) => {
  const body = body_schema.safeParse(req.body)
  if (!body.success)
    throw_error(body.error.errors[0]?.message ?? 'Invalid body', 400)

  const user_id = req.user._id.toString()
  const {
    name,
    amount,
    category,
    frequency,
    day_of_month,
    day_of_week,
    month_of_year,
    description
  } = body.data!

  const next_run = compute_next_run(frequency, {
    day_of_month,
    day_of_week,
    month_of_year
  })

  const doc = await mg.RecurringTransaction.create({
    user_id,
    name,
    amount,
    category,
    frequency,
    day_of_month,
    day_of_week,
    month_of_year,
    description: description ?? '',
    is_active: true,
    next_run
  })

  res.status(201).json({
    message: 'Recurring transaction created',
    data: { recurring_id: doc._id }
  })
}

const body_schema = z.object({
  name: z.string().min(1).max(60),
  amount: z.number().positive(),
  category: z.enum(CATEGORIES),
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  day_of_month: z.number().int().min(1).max(31).optional(),
  day_of_week: z.number().int().min(0).max(6).optional(),
  month_of_year: z.number().int().min(1).max(12).optional(),
  description: z.string().max(200).optional()
})
