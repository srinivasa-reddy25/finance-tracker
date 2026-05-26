import { Router } from 'express'

import { send_monthly_report } from '../controllers/reports/send-monthly-report.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.post('/monthly', send_monthly_report)

export { router as reports_router }
