import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

export const create_note = async (req: Request, res: Response) => {
  const { note } = create_note_body_schema.parse(req.body)

  const new_note = await mg.Note.create({
    user_id: req.user._id,
    note
  })

  res.status(201).json({
    message: 'Note created successfully',
    data: { note_id: new_note._id }
  })
}

const create_note_body_schema = z.object({
  note: z.string().min(1, 'Note cannot be empty')
})
