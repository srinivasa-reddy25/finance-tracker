import type { Request, Response } from 'express'

import { mg } from 'db'
import { log } from 'logging'

import { send_email } from '../../services/email.ts'
import firebase_auth from '../../services/firebase.ts'
import { welcome_template } from '../../templates/welcome.ts'
import { throw_error } from '../../utils/throw-error.ts'

const DEFAULT_CATEGORIES = [
  {
    key: 'food',
    name: 'Food',
    icon: 'food-fork-drink',
    color: '#F97316',
    bg: '#FFF7ED',
    is_deletable: true,
    is_income: false,
    sort_order: 1
  },
  {
    key: 'transport',
    name: 'Transport',
    icon: 'car-outline',
    color: '#3B82F6',
    bg: '#EFF6FF',
    is_deletable: true,
    is_income: false,
    sort_order: 2
  },
  {
    key: 'entertainment',
    name: 'Entertainment',
    icon: 'television-play',
    color: '#A855F7',
    bg: '#FAF5FF',
    is_deletable: true,
    is_income: false,
    sort_order: 3
  },
  {
    key: 'health',
    name: 'Health',
    icon: 'heart-pulse',
    color: '#EF4444',
    bg: '#FEF2F2',
    is_deletable: true,
    is_income: false,
    sort_order: 4
  },
  {
    key: 'shopping',
    name: 'Shopping',
    icon: 'shopping-outline',
    color: '#EC4899',
    bg: '#FDF2F8',
    is_deletable: true,
    is_income: false,
    sort_order: 5
  },
  {
    key: 'bills',
    name: 'Bills',
    icon: 'receipt',
    color: '#EAB308',
    bg: '#FEFCE8',
    is_deletable: true,
    is_income: false,
    sort_order: 6
  },
  {
    key: 'salary',
    name: 'Salary',
    icon: 'cash-multiple',
    color: '#059669',
    bg: '#ECFDF5',
    is_deletable: true,
    is_income: true,
    sort_order: 7
  },
  {
    key: 'others',
    name: 'Others',
    icon: 'shape-outline',
    color: '#6B7280',
    bg: '#F9FAFB',
    is_deletable: false,
    is_income: false,
    sort_order: 99
  }
]

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

  const existing = await mg.User.findOne({ email: decoded.email })
  const is_new_user = !existing

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

  if (is_new_user) {
    const docs = DEFAULT_CATEGORIES.map((c) => ({
      user_id: user._id.toString(),
      key: c.key,
      name: c.name,
      icon: c.icon,
      color: c.color,
      bg: c.bg,
      is_deletable: c.is_deletable,
      is_income: c.is_income,
      sort_order: c.sort_order
    }))
    try {
      await mg.UserCategory.insertMany(docs, { ordered: false })
    } catch {
      // ignore duplicate key errors
    }

    // Fire-and-forget welcome email — don't block the response
    const { subject, html } = welcome_template(
      user.name || (decoded.email as string)
    )
    send_email(user.email, subject, html).catch((err) =>
      log.error({
        app: 'auth',
        message: 'Failed to send welcome email',
        meta: { err }
      })
    )
  }

  res.json({
    message: 'Sync successful',
    data: user
  })
}
