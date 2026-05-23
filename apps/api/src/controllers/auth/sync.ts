import type { Request, Response } from 'express'

import { mg } from 'db'

import firebase_auth from '../../services/firebase.ts'
import { throw_error } from '../../utils/throw-error.ts'

export const sync = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    throw_error('Missing or invalid Authorization header', 401)
  }

  const decoded = await firebase_auth().verifyIdToken(token as string)

  if (!decoded.email) {
    throw_error('Token does not contain a valid email', 401)
  }

  const provider =
    decoded.firebase.sign_in_provider === 'google.com' ? 'google' : 'password'

  if (provider === 'password' && !decoded.email_verified) {
    throw_error('Email not verified', 403)
  }

  const user = await mg.User.findOneAndUpdate(
    { email: decoded.email },
    {
      $setOnInsert: {
        email: decoded.email,
        name: decoded.name?.trim() ?? '',
        profile_image: decoded.picture ?? null,
        firebase_uid: decoded.uid,
        provider,
        is_active: true
      }
    },
    { upsert: true, new: true }
  )

  res.json({
    message: 'Sync successful',
    data: user
  })
}
