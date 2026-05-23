import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import { throw_error } from '../../utils/throw-error.ts'

export const delete_note_by_id = async (req: Request, res: Response) => {
  const { note_id } = delete_note_params_schema.parse(req.params)

  const deleted_note = await mg.Note.findOneAndDelete({
    _id: note_id,
    user_id: req.user._id
  }).lean()

  if (!deleted_note) {
    throw_error('Note not found', 404)
  }

  res.json({
    message: 'Note deleted successfully'
  })
}

const delete_note_params_schema = z.object({
  note_id: z.string().min(1, 'Note ID is required')
})
