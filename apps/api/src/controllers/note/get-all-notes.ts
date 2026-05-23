import type { Request, Response } from 'express'

import { mg } from 'db'

export const get_all_notes = async (req: Request, res: Response) => {
  const notes = await mg.Note.find({ user_id: req.user._id }).lean()

  res.json({
    message: 'Notes fetched successfully',
    data: notes
  })
}
