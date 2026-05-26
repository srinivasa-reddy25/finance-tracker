import type { TAuthProvider } from './auth.js'

export type TUser = {
  email: string
  name: string
  profile_image?: string | null
  firebase_uid: string
  provider: TAuthProvider
  is_active: boolean
  last_budget_alert_80?: string | null
  last_budget_alert_100?: string | null
  createdAt?: Date
  updatedAt?: Date
}
