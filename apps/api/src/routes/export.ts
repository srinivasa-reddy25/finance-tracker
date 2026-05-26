import { Router } from 'express'

import { export_transactions } from '../controllers/export/export-transactions.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.post('/transactions', export_transactions)

export { router as export_router }
