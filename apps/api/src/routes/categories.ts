import { Router } from 'express'

import { create_category } from '../controllers/category/create-category.ts'
import { delete_category } from '../controllers/category/delete-category.ts'
import { get_categories } from '../controllers/category/get-categories.ts'
import { update_category } from '../controllers/category/update-category.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.get('/', get_categories)
router.post('/', create_category)
router.patch('/:id', update_category)
router.delete('/:id', delete_category)

export { router as categories_router }
