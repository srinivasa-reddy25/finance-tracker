import path from 'path'

import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { log } from 'logging'

import { env } from '../constants/env.ts'
import { throw_error } from '../utils/throw-error.ts'

let auth: Auth

const initialize_firebase = async (): Promise<Auth> => {
  if (!env.firebase_config_path || env.firebase_config_path === 'NA') {
    throw_error('Firebase config path not set')
  }

  const config_path = path.resolve(env.firebase_config_path)
  const { default: service_account } = await import(config_path)

  const firebase_app = initializeApp({
    credential: cert(service_account)
  })

  return getAuth(firebase_app)
}

initialize_firebase()
  .then((initialized_auth) => {
    auth = initialized_auth
    log.info({ app: 'firebase', message: 'Firebase auth initialized' })
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
