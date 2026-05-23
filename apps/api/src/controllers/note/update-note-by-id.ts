import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import { throw_error } from '../../utils/throw-error.ts'

export const update_note_by_id = async (req: Request, res: Response) => {
  const { note_id } = update_note_params_schema.parse(req.params)
  const { note } = update_note_body_schema.parse(req.body)

  const updated_note = await mg.Note.findOneAndUpdate(
    { _id: note_id, user_id: req.user._id },
    { note },
    { new: true }
  ).lean()

  if (!updated_note) {
    throw_error('Note not found', 404)
  }

  res.json({
    message: 'Note updated successfully'
  })
}

const update_note_params_schema = z.object({
  note_id: z.string().min(1, 'Note ID is required')
})

const update_note_body_schema = z.object({
  note: z.string().min(1, 'Note cannot be empty')
})
