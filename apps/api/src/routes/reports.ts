import { Router } from 'express'

import { get_monthly_summary } from '../controllers/reports/monthly-summary.ts'
import { authenticate } from '../middlewares/authenticate.ts'

export const reports_router = Router()

reports_router.use(authenticate)

reports_router.get('/monthly-summary', get_monthly_summary)
