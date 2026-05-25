import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import CustomError from '../../utils/CustomError.ts'

export const create_category = async (req: Request, res: Response) => {
  const body = body_schema.parse(req.body)
  const user_id = req.user._id.toString()

  const key = body.name.toLowerCase().replace(/\s+/g, '_')

  const total = await mg.UserCategory.countDocuments({
    user_id,
    key: { $exists: true }
  })
  if (total >= 10)
    throw new CustomError('You can have at most 10 categories', 422)

  const exists = await mg.UserCategory.findOne({ user_id, key })
  if (exists)
    throw new CustomError('A category with this name already exists', 409)

  const category = await mg.UserCategory.create({
    user_id,
    key,
    name: body.name,
    icon: body.icon,
    color: body.color,
    bg: body.bg,
    is_deletable: true,
    is_income: false,
    sort_order: 50
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
