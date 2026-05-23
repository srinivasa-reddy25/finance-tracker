import { Router } from 'express'

import { create_note } from '../controllers/note/create-note.ts'
import { delete_note_by_id } from '../controllers/note/delete-note-by-id.ts'
import { get_all_notes } from '../controllers/note/get-all-notes.ts'
import { get_note_by_id } from '../controllers/note/get-note-by-id.ts'
import { update_note_by_id } from '../controllers/note/update-note-by-id.ts'
import { authenticate } from '../middlewares/authenticate.ts'

const router = Router()

router.use(authenticate)

router.get('/', get_all_notes)
router.post('/', create_note)
router.get('/:note_id', get_note_by_id)
router.patch('/:note_id', update_note_by_id)
router.delete('/:note_id', delete_note_by_id)

export { router as note_router }
