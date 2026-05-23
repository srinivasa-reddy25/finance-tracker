import { Router } from 'express'

import { parse_image } from '../controllers/ai/parse-image.ts'
import { parse_voice } from '../controllers/ai/parse-voice.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.post('/parse-voice', parse_voice)
router.post('/parse-image', parse_image)

export { router as ai_router }
