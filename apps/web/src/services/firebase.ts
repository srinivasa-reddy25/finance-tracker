import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

import { env } from '@/constants/env'

const firebaseConfig = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  storageBucket: env.firebaseStorageBucket,
  messagingSenderId: env.firebaseMessagingSenderId,
  appId: env.firebaseAppId
}

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)

export { auth }
