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

describe('PATCH /api/v1/note/:note_id', () => {
  it('should update a note and return only a message', async () => {
    const response = await request(app)
      .patch(`/api/v1/note/${data.notes.primary_1._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ note: 'Updated content' })

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Note updated successfully')
    expect(response.body.data).toBeUndefined()
  })

  it('should persist the update in the database', async () => {
    await request(app)
      .patch(`/api/v1/note/${data.notes.primary_1._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ note: 'Updated content' })

    const note = await mg.Note.findById(data.notes.primary_1._id).lean()
    expect(note?.note).toBe('Updated content')
  })

  it('should return 404 if note does not exist', async () => {
    const response = await request(app)
      .patch('/api/v1/note/000000000000000000000001')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ note: 'Updated content' })

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Note not found')
  })

  it('should return 404 for a note belonging to another user', async () => {
    const response = await request(app)
      .patch(`/api/v1/note/${data.notes.secondary._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ note: 'Updated content' })

    expect(response.status).toBe(404)
  })

  it('should return 400 if note body is empty', async () => {
    const response = await request(app)
      .patch(`/api/v1/note/${data.notes.primary_1._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ note: '' })

    expect(response.status).toBe(400)
  })

  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .patch(`/api/v1/note/${data.notes.primary_1._id}`)
      .send({ note: 'Updated content' })

    expect(response.status).toBe(401)
  })
})
