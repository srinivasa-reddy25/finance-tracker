import { model, Schema } from 'mongoose'

import type { TRecurringRun } from '@tejadev/shared'

const schema = new Schema<TRecurringRun>(
  {
    recurring_id: { type: String, required: true, ref: 'RecurringTransaction' },
    user_id: { type: String, required: true, ref: 'User' },
    status: { type: String, required: true, enum: ['success', 'failed'] },
    fired_at: { type: Date, required: true },
    transaction_id: { type: String },
    error: { type: String },
    amount: { type: Number, required: true },
    name: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
)

schema.index({ recurring_id: 1, fired_at: -1 })
schema.index({ user_id: 1, fired_at: -1 })

export const recurring_run_model = model<TRecurringRun>('RecurringRun', schema)
