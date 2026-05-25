import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import CustomError from '../../utils/CustomError.ts'

export const update_category = async (req: Request, res: Response) => {
  const { id } = req.params
  const body = body_schema.parse(req.body)
  const user_id = req.user._id.toString()

  const category = await mg.UserCategory.findOne({ _id: id, user_id })
  if (!category) throw new CustomError('Category not found', 404)

  const update: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const new_key = body.name.toLowerCase().replace(/\s+/g, '_')
    if (new_key !== category.key) {
      const exists = await mg.UserCategory.findOne({
        user_id,
        key: new_key,
        _id: { $ne: id }
      })
      if (exists)
        throw new CustomError('A category with this name already exists', 409)
      update.key = new_key
    }
    update.name = body.name
  }

  if (body.icon !== undefined) update.icon = body.icon
  if (body.color !== undefined) update.color = body.color
  if (body.bg !== undefined) update.bg = body.bg
  if (body.budget !== undefined) update.budget = body.budget

  await mg.UserCategory.updateOne({ _id: id, user_id }, { $set: update })

  if (update.key) {
    await mg.Transaction.updateMany(
      { user_id, category: category.key },
      { $set: { category: update.key as string } }
    )
  }

  res.json({ message: 'Category updated' })
}

const body_schema = z.object({
  name: z.string().trim().min(1).max(30).optional(),
  icon: z.string().min(1).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  bg: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  budget: z.number().min(0).nullable().optional()
})
