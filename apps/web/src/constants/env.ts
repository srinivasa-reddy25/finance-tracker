type TEnv = {
  NEXT_PUBLIC_APP_NAME: string
  NEXT_PUBLIC_API_URL: string
  firebaseApiKey: string
  firebaseAuthDomain: string
  firebaseProjectId: string
  firebaseStorageBucket: string
  firebaseMessagingSenderId: string
  firebaseAppId: string
  googleClientId: string
}

export const env: TEnv = {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'NA',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'NA',
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'NA',
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'NA',
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'NA',
  firebaseStorageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'NA',
  firebaseMessagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'NA',
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? 'NA',
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? 'NA'
}
