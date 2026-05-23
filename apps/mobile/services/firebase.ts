import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { initializeApp } from 'firebase/app'
import {
  signOut as firebaseSignOut,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth'

import { env } from '../constants/env'

WebBrowser.maybeCompleteAuthSession()

const app = initializeApp(env.firebase)
export const auth = getAuth(app)

export const signInWithGoogle = async () => {
  const redirectUri = AuthSession.makeRedirectUri()

  const request = new AuthSession.AuthRequest({
    clientId: env.firebase.app_id,
    scopes: ['openid', 'profile', 'email'],
    redirectUri
  })

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token'
  }

  const result = await request.promptAsync(discovery)

  if (result.type !== 'success') return null

  const credential = GoogleAuthProvider.credential(
    result.params.id_token ?? null,
    result.params.access_token ?? null
  )

  const user_credential = await signInWithCredential(auth, credential)
  return user_credential.user
}

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export const signOut = () => firebaseSignOut(auth)
