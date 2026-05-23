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

describe('POST /api/v1/note', () => {
  it('should create a note and return the note_id', async () => {
    const response = await request(app)
      .post('/api/v1/note')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ note: 'My new note' })

    expect(response.status).toBe(201)
    expect(response.body.message).toBe('Note created successfully')
    expect(response.body.data).toHaveProperty('note_id')
  })

  it('should persist the note in the database', async () => {
    const response = await request(app)
      .post('/api/v1/note')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ note: 'Persisted note' })

    const note = await mg.Note.findById(response.body.data.note_id).lean()
    expect(note).not.toBeNull()
    expect(note?.note).toBe('Persisted note')
  })

  it('should return 400 if note is missing', async () => {
    const response = await request(app)
      .post('/api/v1/note')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({})

    expect(response.status).toBe(400)
  })

  it('should return 400 if note is an empty string', async () => {
    const response = await request(app)
      .post('/api/v1/note')
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ note: '' })

    expect(response.status).toBe(400)
  })

  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/v1/note')
      .send({ note: 'My new note' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Invalid token provided')
  })
})
