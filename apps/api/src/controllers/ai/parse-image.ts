import type { Request, Response } from 'express'

import { z } from 'zod'

import { throw_error } from '../../utils/throw-error.ts'

export const parse_image = async (req: Request, res: Response) => {
  const body = body_schema.safeParse(req.body)

  if (!body.success) {
    throw_error(body.error.errors[0]?.message ?? 'Invalid request body', 400)
  }

  // TODO: send body.data.base64 to Claude vision API and parse structured transaction from receipt
  res.json({
    message: 'Image parsed',
    data: {
      amount: 0,
      description: 'Receipt',
      category: 'others',
      note: ''
    }
  })
}

const body_schema = z.object({
  base64: z.string({ required_error: 'Base64 image is required' }).min(1),
  mime_type: z
    .enum(['image/jpeg', 'image/png', 'image/webp'])
    .default('image/jpeg')
})
