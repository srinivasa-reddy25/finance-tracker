import type { Request, Response } from 'express'

import { z } from 'zod'

import { slugify } from '@tejadev/shared'

const post_slug_controller = (req: Request, res: Response) => {
  const { text } = post_slug_schema.parse(req.body)
  const slug = slugify(text)
  res.json({ input: text, slug })
}

const post_slug_schema = z.object({
  text: z.string()
})

export { post_slug_controller }
