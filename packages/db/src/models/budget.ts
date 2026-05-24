import { model, Schema } from 'mongoose'

import type { TBudget } from '@tejadev/shared'

const budget_schema = new Schema<TBudget>(
  {
    user_id: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true, versionKey: false }
)

// One budget per user per category
budget_schema.index({ user_id: 1, category: 1 }, { unique: true })

export const budget_model = model<TBudget>('Budget', budget_schema)
