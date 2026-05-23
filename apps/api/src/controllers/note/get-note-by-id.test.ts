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

describe('GET /api/v1/note/:note_id', () => {
  it('should return the note by id', async () => {
    const response = await request(app)
      .get(`/api/v1/note/${data.notes.primary_1._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Note fetched successfully')
    expect(response.body.data.note).toBe('First note of primary user')
  })

  it('should return 404 if note does not exist', async () => {
    const response = await request(app)
      .get('/api/v1/note/000000000000000000000001')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Note not found')
  })

  it('should return 404 for a note belonging to another user', async () => {
    const response = await request(app)
      .get(`/api/v1/note/${data.notes.secondary._id}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)

    expect(response.status).toBe(404)
  })

  it('should reject unauthenticated requests', async () => {
    const response = await request(app).get(
      `/api/v1/note/${data.notes.primary_1._id}`
    )

    expect(response.status).toBe(401)
  })
})
