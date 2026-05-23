import type { Types } from 'mongoose'

import type { TUser } from '@tejadev/shared'

declare global {
  namespace Express {
    interface Request {
      request_id: string
      user: TUser & { _id: Types.ObjectId }
    }
  }
}

export {}
