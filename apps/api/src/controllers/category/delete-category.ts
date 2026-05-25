import type { Request, Response } from 'express'

import { mg } from 'db'

import CustomError from '../../utils/CustomError.ts'

export const delete_category = async (req: Request, res: Response) => {
  const { id } = req.params
  const migrate = req.query.migrate === 'true'
  const user_id = req.user._id.toString()

  const category = await mg.UserCategory.findOne({ _id: id, user_id })
  if (!category) throw new CustomError('Category not found', 404)

  if (!category.is_deletable) {
    throw new CustomError('This category cannot be deleted', 403)
  }

  const transaction_count = await mg.Transaction.countDocuments({
    user_id,
    category: category.key
  })

  // If transactions exist and not confirmed, return the count so client can warn
  if (transaction_count > 0 && !migrate) {
    res.status(409).json({
      message: `${transaction_count} transaction${transaction_count === 1 ? '' : 's'} will be moved to Others`,
      data: { transaction_count }
    })
    return
  }

  // Migrate transactions to others before deleting
  if (transaction_count > 0 && migrate) {
    await mg.Transaction.updateMany(
      { user_id, category: category.key },
      { $set: { category: 'others' } }
    )
  }

  await mg.UserCategory.deleteOne({ _id: id, user_id })

  res.json({ message: 'Category deleted' })
}
