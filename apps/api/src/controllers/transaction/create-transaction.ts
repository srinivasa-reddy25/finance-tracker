import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import { TRANSACTION_SOURCES } from '@tejadev/shared'

import { throw_error } from '../../utils/throw-error.ts'

export const create_transaction = async (req: Request, res: Response) => {
  const body = body_schema.safeParse(req.body)

  if (!body.success) {
    throw_error(body.error.errors[0]?.message ?? 'Invalid request body', 400)
  }

  const transaction = await mg.Transaction.create({
    ...body.data,
    user_id: req.user.firebase_uid
  })

  res.status(201).json({
    message: 'Transaction created',
    data: { transaction_id: transaction._id }
  })
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
