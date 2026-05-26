import path from 'path'

import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'
import { log } from 'logging'

import { env } from '../constants/env.ts'
import { throw_error } from '../utils/throw-error.ts'

let auth: Auth
let messaging: Messaging

const initialize_firebase = async (): Promise<void> => {
  if (!env.firebase_config_path || env.firebase_config_path === 'NA') {
    throw_error('Firebase config path not set')
  }

  const config_path = path.resolve(env.firebase_config_path)
  const { default: service_account } = await import(config_path)

  const firebase_app = initializeApp({
    credential: cert(service_account)
  })

  auth = getAuth(firebase_app)
  messaging = getMessaging(firebase_app)
}

initialize_firebase()
  .then(() => {
    log.info({ app: 'firebase', message: 'Firebase initialized' })
  })
  .catch((error) => {
    log.error({
      app: 'firebase',
      message: 'Failed to initialize Firebase',
      meta: { error }
    })
  })

export default (): Auth => {
  if (!auth) {
    throw_error('Firebase Auth has not been initialized')
  }

  return auth
}

export const get_messaging = (): Messaging => {
  if (!messaging) {
    throw_error('Firebase Messaging has not been initialized')
  }

  return messaging
}
