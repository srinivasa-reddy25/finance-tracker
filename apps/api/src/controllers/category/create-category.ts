import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

export const create_category = async (req: Request, res: Response) => {
  const body = body_schema.parse(req.body)

  const category = await mg.UserCategory.create({
    ...body,
    user_id: req.user.firebase_uid
  })

  res.status(201).json({
    message: 'Category created',
    data: { category_id: category._id }
  })
}

const body_schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(30, 'Name too long'),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color hex'),
  bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid bg hex')
})
