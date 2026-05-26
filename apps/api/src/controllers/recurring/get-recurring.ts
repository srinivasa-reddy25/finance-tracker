import type { Request, Response } from 'express'

import { mg } from 'db'

export const get_recurring = async (req: Request, res: Response) => {
  const user_id = req.user._id.toString()
  const items = await mg.RecurringTransaction.find({ user_id })
    .sort({ createdAt: -1 })
    .lean()
  res.json({
    message: 'Recurring transactions fetched',
    data: { recurring: items }
  })
}
