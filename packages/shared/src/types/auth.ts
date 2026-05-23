import { AUTH_PROVIDERS } from '../constants/auth.js'

export type TAuthProvider = (typeof AUTH_PROVIDERS)[number]
