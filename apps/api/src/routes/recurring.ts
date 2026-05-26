import { Router } from 'express'

import { create_recurring } from '../controllers/recurring/create-recurring.ts'
import { delete_recurring } from '../controllers/recurring/delete-recurring.ts'
import { get_recurring } from '../controllers/recurring/get-recurring.ts'
import { update_recurring } from '../controllers/recurring/update-recurring.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.get('/', get_recurring)
router.post('/', create_recurring)
router.patch('/:id', update_recurring)
router.delete('/:id', delete_recurring)

export { router as recurring_router }
