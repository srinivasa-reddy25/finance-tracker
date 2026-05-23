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

describe('GET /api/v1/note', () => {
  it('should return all notes for the authenticated user', async () => {
    const response = await request(app)
      .get('/api/v1/note')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Notes fetched successfully')
    expect(response.body.data).toHaveLength(2)
  })

  it('should not return notes belonging to other users', async () => {
    const response = await request(app)
      .get('/api/v1/note')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    const note_ids = response.body.data.map((n: { _id: string }) => n._id)
    expect(note_ids).not.toContain(data.notes.secondary._id.toString())
  })

  it('should return an empty array if user has no notes', async () => {
    set_authenticated_user(data.users.secondary)
    await mg.Note.deleteMany({ user_id: data.users.secondary._id })

    const response = await request(app)
      .get('/api/v1/note')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(0)
  })

  it('should reject unauthenticated requests', async () => {
    const response = await request(app).get('/api/v1/note')

    expect(response.status).toBe(401)
  })
})
