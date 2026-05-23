import { Router } from 'express'

import { create_transaction } from '../controllers/transaction/create-transaction.ts'
import { delete_transaction_by_id } from '../controllers/transaction/delete-transaction-by-id.ts'
import { get_all_transactions } from '../controllers/transaction/get-all-transactions.ts'
import { update_transaction_by_id } from '../controllers/transaction/update-transaction-by-id.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.get('/', get_all_transactions)
router.post('/', create_transaction)
router.patch('/:id', update_transaction_by_id)
router.delete('/:id', delete_transaction_by_id)

export { router as transactions_router }
