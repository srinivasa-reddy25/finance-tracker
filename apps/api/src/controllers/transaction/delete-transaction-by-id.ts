import type { Request, Response } from 'express'

import { mg } from 'db'

import { throw_error } from '../../utils/throw-error.ts'

export const delete_transaction_by_id = async (req: Request, res: Response) => {
  const { id } = req.params

  const transaction = await mg.Transaction.findOneAndDelete({
    _id: id,
    user_id: req.user.firebase_uid
  })

  if (!transaction) {
    throw_error('Transaction not found', 404)
  }

  res.json({ message: 'Transaction deleted' })
}
