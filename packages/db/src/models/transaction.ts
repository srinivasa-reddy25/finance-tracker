import { model, Schema } from 'mongoose'

import {
  CATEGORIES,
  TRANSACTION_SOURCES,
  type TTransaction
} from '@tejadev/shared'

const transaction_schema = new Schema<TTransaction>(
  {
    user_id: {
      type: String,
      required: true,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES
    },
    note: {
      type: String,
      default: '',
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      required: true,
      enum: TRANSACTION_SOURCES,
      default: 'manual'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

transaction_schema.index({ user_id: 1, date: -1 })
transaction_schema.index({ user_id: 1, category: 1 })

export const transaction_model = model<TTransaction>(
  'Transaction',
  transaction_schema
)
