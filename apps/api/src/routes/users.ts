import { Router } from 'express'

import { update_fcm_token } from '../controllers/users/update-fcm-token.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.patch('/fcm-token', update_fcm_token)

export { router as users_router }
