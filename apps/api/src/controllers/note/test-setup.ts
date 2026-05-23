import type { NextFunction, Request, Response } from 'express'
import express from 'express'

import type { TNoteDoc } from 'db'
import type { Types } from 'mongoose'

import type { TUser } from '@tejadev/shared'

import 'express-async-errors'

import { mg } from 'db'
import { vi } from 'vitest'

import error_handler from '../../middlewares/error-handler'
import { note_router } from '../../routes/note'
import { throw_error } from '../../utils/throw-error'

export const AUTH_TOKEN = 'test-auth-token'

export type TUserDoc = TUser & { _id: Types.ObjectId }

type TMockAuthState = {
  token: string
  user: TUserDoc | null
}

export const mock_auth_state: TMockAuthState = {
  token: AUTH_TOKEN,
  user: null
}

vi.mock('@/middlewares/authenticate', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction) => {
    const auth_header = req.headers.authorization
    if (!auth_header) {
      throw_error('Invalid token provided', 401)
    }

    const token = auth_header?.split(' ')[1]
    if (token !== mock_auth_state.token) {
      throw_error('Invalid token provided', 401)
    }

    const { user } = mock_auth_state
    if (!user) {
      throw_error(
        'Access denied. Please ask the admin to give you access.',
        401
      )
    } else {
      req.user = user
      next()
    }
  }
}))

export const create_app = () => {
  const app = express()
  app.use(express.json())
  app.use('/api/v1/note', note_router)
  app.use(error_handler)
  return app
}

export type TSeedData = {
  users: {
    primary: TUserDoc
    secondary: TUserDoc
  }
  notes: {
    primary_1: TNoteDoc
    primary_2: TNoteDoc
    secondary: TNoteDoc
  }
}

export const seed_data = async (): Promise<TSeedData> => {
  const primary_user = (
    await mg.User.create({
      email: 'primary@example.com',
      name: 'Primary User',
      firebase_uid: 'firebase-uid-primary',
      provider: 'password',
      is_active: true
    })
  ).toObject() as TUserDoc

  const secondary_user = (
    await mg.User.create({
      email: 'secondary@example.com',
      name: 'Secondary User',
      firebase_uid: 'firebase-uid-secondary',
      provider: 'password',
      is_active: true
    })
  ).toObject() as TUserDoc

  const primary_note_1 = (
    await mg.Note.create({
      user_id: primary_user._id,
      note: 'First note of primary user'
    })
  ).toObject() as TNoteDoc

  const primary_note_2 = (
    await mg.Note.create({
      user_id: primary_user._id,
      note: 'Second note of primary user'
    })
  ).toObject() as TNoteDoc

  const secondary_note = (
    await mg.Note.create({
      user_id: secondary_user._id,
      note: 'Note belonging to secondary user'
    })
  ).toObject() as TNoteDoc

  return {
    users: {
      primary: primary_user,
      secondary: secondary_user
    },
    notes: {
      primary_1: primary_note_1,
      primary_2: primary_note_2,
      secondary: secondary_note
    }
  }
}

export const set_authenticated_user = (user: TUserDoc) => {
  mock_auth_state.user = user
}
