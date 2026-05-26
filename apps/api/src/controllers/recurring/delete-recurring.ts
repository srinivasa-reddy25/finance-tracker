import type { Request, Response } from 'express'

import { mg } from 'db'

import CustomError from '../../utils/CustomError.ts'

export const delete_recurring = async (req: Request, res: Response) => {
  const { id } = req.params
  const user_id = req.user._id.toString()
  const doc = await mg.RecurringTransaction.findOneAndDelete({
    _id: id,
    user_id
  })
  if (!doc) throw new CustomError('Recurring transaction not found', 404)
  res.json({ message: 'Recurring transaction deleted' })
}
