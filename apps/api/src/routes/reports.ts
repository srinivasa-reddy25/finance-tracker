import { Router } from 'express'

import { get_monthly_summary } from '../controllers/reports/monthly-summary.ts'
import { authentication } from '../middlewares/authentication.ts'

export const reports_router = Router()

reports_router.use(authentication)

reports_router.get('/monthly-summary', get_monthly_summary)
