import type { Request, Response } from 'express'

import { mg } from 'db'

export const get_categories = async (req: Request, res: Response) => {
  const categories = await mg.UserCategory.find({
    user_id: req.user.firebase_uid
  })
    .sort({ createdAt: 1 })
    .lean()

  res.json({ message: 'Categories fetched', data: { categories } })
}
