import type { NextFunction, Request, Response } from 'express'

import { mg } from 'db'

import firebase_auth from '../services/firebase.ts'
import { throw_error } from '../utils/throw-error.ts'

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const id_token = req.headers.authorization?.split(' ')[1]

  if (!id_token) {
    throw_error('Invalid token provided', 401)
  }

  const decoded_token = await firebase_auth().verifyIdToken(id_token as string)

  const db_user = await mg.User.findOne({
    email: decoded_token.email?.toLowerCase(),
    is_active: true
  })
    .select('-createdAt -updatedAt')
    .lean()

  if (db_user) {
    req.user = db_user
    next()
  } else {
    throw_error('Access denied. Please ask the admin to give you access.', 401)
  }
}
