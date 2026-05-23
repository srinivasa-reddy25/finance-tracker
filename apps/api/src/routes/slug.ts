import { Router } from 'express'

import { post_slug_controller } from '../controllers/slug/post-slug.ts'

const router = Router()

router.post('/', post_slug_controller)

export { router as slug_router }
