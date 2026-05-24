import { model, Schema } from 'mongoose'

import type { TUserCategory } from '@tejadev/shared'

const user_category_schema = new Schema<TUserCategory>(
  {
    user_id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    bg: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
)

user_category_schema.index({ user_id: 1 })

export const user_category_model = model<TUserCategory>(
  'UserCategory',
  user_category_schema
)
