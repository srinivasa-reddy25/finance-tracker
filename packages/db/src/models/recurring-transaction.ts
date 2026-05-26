import { model, Schema } from 'mongoose'

import {
  CATEGORIES,
  RECURRENCE_FREQUENCIES,
  type TRecurringTransaction
} from '@tejadev/shared'

const schema = new Schema<TRecurringTransaction>(
  {
    user_id: { type: String, required: true, ref: 'User' },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: CATEGORIES },
    frequency: { type: String, required: true, enum: RECURRENCE_FREQUENCIES },
    day_of_month: { type: Number, min: 1, max: 31 },
    day_of_week: { type: Number, min: 0, max: 6 },
    month_of_year: { type: Number, min: 1, max: 12 },
    description: { type: String, default: '', trim: true },
    is_active: { type: Boolean, default: true },
    next_run: { type: Date, required: true },
    last_run: { type: Date }
  },
  { timestamps: true, versionKey: false }
)

schema.index({ user_id: 1, is_active: 1 })
schema.index({ next_run: 1, is_active: 1 })

export const recurring_transaction_model = model<TRecurringTransaction>(
  'RecurringTransaction',
  schema
)
