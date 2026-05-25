import { Router } from 'express'

import { get_analytics } from '../controllers/analytics/get-analytics.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.get('/', get_analytics)

export { router as analytics_router }
