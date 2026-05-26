import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import CustomError from '../../utils/CustomError.ts'

export const update_fcm_token = async (req: Request, res: Response) => {
  const { token } = body_schema.parse(req.body)
  const user_id = req.user._id.toString()

  const result = await mg.User.updateOne({ _id: user_id }, { fcm_token: token })
  if (result.matchedCount === 0) throw new CustomError('User not found', 404)

  res.json({ message: 'FCM token updated' })
}

const body_schema = z.object({
  token: z.string().min(1)
})
