import { Router } from 'express'

import { delete_budget } from '../controllers/budget/delete-budget.ts'
import { get_budgets } from '../controllers/budget/get-budgets.ts'
import { upsert_budget } from '../controllers/budget/upsert-budget.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.get('/', get_budgets)
router.put('/:category', upsert_budget)
router.delete('/:category', delete_budget)

export { router as budgets_router }
