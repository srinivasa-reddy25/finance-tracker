import { mg } from 'db'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  clear_test_db,
  connect_test_db,
  disconnect_test_db
} from '../../services/test-db'
import {
  AUTH_TOKEN,
  create_app,
  seed_data,
  set_authenticated_user,
  TSeedData
} from './test-setup.ts'

const app = create_app()
let data: TSeedData

beforeAll(async () => {
  await connect_test_db()
})

afterAll(async () => {
  await disconnect_test_db()
})

beforeEach(async () => {
  await clear_test_db()
  data = await seed_data()
  set_authenticated_user(data.users.primary)
})

describe('DELETE /api/v1/note/:note_id', () => {
  it('should delete a note and return only a message', async () => {
    const response = await request(app)
      .delete(`/api/v1/note/${data.notes.primary_1._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Note deleted successfully')
    expect(response.body.data).toBeUndefined()
  })

  it('should remove the note from the database', async () => {
    await request(app)
      .delete(`/api/v1/note/${data.notes.primary_1._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    const note = await mg.Note.findById(data.notes.primary_1._id).lean()
    expect(note).toBeNull()
  })

  it('should return 404 if note does not exist', async () => {
    const response = await request(app)
      .delete('/api/v1/note/000000000000000000000001')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Note not found')
  })

  it('should return 404 for a note belonging to another user', async () => {
    const response = await request(app)
      .delete(`/api/v1/note/${data.notes.secondary._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    expect(response.status).toBe(404)
  })

  it('should reject unauthenticated requests', async () => {
    const response = await request(app).delete(
      `/api/v1/note/${data.notes.primary_1._id}`
    )

    expect(response.status).toBe(401)
  })
})
