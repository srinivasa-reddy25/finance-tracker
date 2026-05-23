import type { Request, Response } from 'express'

import { z } from 'zod'

import { throw_error } from '../../utils/throw-error.ts'

export const parse_voice = async (req: Request, res: Response) => {
  const body = body_schema.safeParse(req.body)

  if (!body.success) {
    throw_error(body.error.errors[0]?.message ?? 'Invalid request body', 400)
  }

  // TODO: send text to Claude API and parse structured transaction
  res.json({
    message: 'Voice parsed',
    data: {
      amount: 0,
      description: body.data!.text,
      category: 'others',
      note: ''
    }
  })
}

const body_schema = z.object({
  text: z
    .string({ required_error: 'Transcribed text is required' })
    .trim()
    .min(1)
})
