import { Router } from 'express'

import { sync } from '../controllers/auth/sync.ts'
import { update_budget } from '../controllers/auth/update-budget.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.post('/sync', sync)
router.patch('/budget', authenticate, update_budget)

export { router as auth_router }
