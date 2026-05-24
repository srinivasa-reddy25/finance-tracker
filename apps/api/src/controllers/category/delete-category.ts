import type { Request, Response } from 'express'

import { mg } from 'db'

import CustomError from '../../utils/CustomError.ts'

export const delete_category = async (req: Request, res: Response) => {
  const { id } = req.params

  const deleted = await mg.UserCategory.findOneAndDelete({
    _id: id,
    user_id: req.user.firebase_uid
  })

  if (!deleted) throw new CustomError('Category not found', 404)

  res.json({ message: 'Category deleted' })
}
