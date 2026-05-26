import { model, Schema } from 'mongoose'

import { AUTH_PROVIDERS, TUser } from '@tejadev/shared'

export const user_schema = new Schema<TUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    profile_image: {
      type: String,
      default: null,
      trim: true
    },
    firebase_uid: {
      type: String,
      required: true,
      trim: true
    },
    provider: {
      type: String,
      required: true,
      enum: AUTH_PROVIDERS
    },
    is_active: {
      type: Boolean,
      default: true
    },
    last_budget_alert_80: { type: String, default: null },
    last_budget_alert_100: { type: String, default: null },
    fcm_token: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

user_schema.index({ email: 1, provider: 1 }, { unique: true })
user_schema.index({ firebase_uid: 1 }, { unique: true })

export const user_model = model<TUser>('User', user_schema)
