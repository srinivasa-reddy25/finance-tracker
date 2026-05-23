import { Router } from 'express'

import { sync } from '../controllers/auth/sync.ts'

const router = Router()

router.post('/sync', sync)

export { router as auth_router }
