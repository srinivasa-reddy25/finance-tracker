import type { TAuthProvider } from './auth.js'

export type TUser = {
  email: string
  name: string
  profile_image?: string | null
  firebase_uid: string
  provider: TAuthProvider
  is_active: boolean
  createdAt?: Date
  updatedAt?: Date
}
