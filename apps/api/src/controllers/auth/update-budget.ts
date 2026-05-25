import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

export const update_budget = async (req: Request, res: Response) => {
  const body = body_schema.parse(req.body)
  const user_id = req.user._id.toString()

  await mg.User.updateOne({ _id: user_id }, { $set: { budget: body.budget } })

  res.json({ message: 'Budget updated' })
}

const body_schema = z.object({
  budget: z.number().min(0).nullable()
})
