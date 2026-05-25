import { model, Schema } from 'mongoose'

import type { TUserCategory } from '@tejadev/shared'

const user_category_schema = new Schema<TUserCategory>(
  {
    user_id: { type: String, required: true },
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    bg: { type: String, required: true },
    is_deletable: { type: Boolean, required: true, default: true },
    is_income: { type: Boolean, required: true, default: false },
    sort_order: { type: Number, required: true, default: 99 },
    budget: { type: Number, default: null }
  },
  { timestamps: true, versionKey: false }
)

user_category_schema.index({ user_id: 1, key: 1 }, { unique: true })

export const user_category_model = model<TUserCategory>(
  'UserCategory',
  user_category_schema
)
