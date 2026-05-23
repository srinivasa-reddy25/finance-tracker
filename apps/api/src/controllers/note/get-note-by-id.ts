import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import { throw_error } from '../../utils/throw-error.ts'

export const get_note_by_id = async (req: Request, res: Response) => {
  const { note_id } = get_note_params_schema.parse(req.params)

  const note = await mg.Note.findOne({
    _id: note_id,
    user_id: req.user._id
  }).lean()

  if (!note) {
    throw_error('Note not found', 404)
  }

  res.json({
    message: 'Note fetched successfully',
    data: note
  })
}

const get_note_params_schema = z.object({
  note_id: z.string().min(1, 'Note ID is required')
})
