import type { Request, Response } from 'express'

import { mg } from 'db'

import CustomError from '../../utils/CustomError.ts'

export const get_recurring_runs = async (req: Request, res: Response) => {
  const user_id = req.user._id.toString()
  const { id } = req.params

  const recurring = await mg.RecurringTransaction.findOne({
    _id: id,
    user_id
  }).lean()

  if (!recurring) throw new CustomError('Recurring transaction not found', 404)

  const runs = await mg.RecurringRun.find({ recurring_id: id, user_id })
    .sort({ fired_at: -1 })
    .limit(50)
    .lean()

  res.json({ message: 'Runs fetched', data: runs })
}
