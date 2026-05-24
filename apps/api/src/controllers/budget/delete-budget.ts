import type { Request, Response } from 'express'

import { mg } from 'db'

import CustomError from '../../utils/CustomError.ts'

export const delete_budget = async (req: Request, res: Response) => {
  const { category } = req.params

  const deleted = await mg.Budget.findOneAndDelete({
    user_id: req.user.firebase_uid,
    category
  })

  if (!deleted) throw new CustomError('Budget not found', 404)

  res.json({ message: 'Budget deleted' })
}
