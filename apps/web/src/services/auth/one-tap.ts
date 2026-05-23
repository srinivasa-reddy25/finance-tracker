import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'

import { auth } from '@/services/firebase'

import { AuthenticationError } from './errors'

export const signInWithOneTap = async (idToken: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken)
    return await signInWithCredential(auth, credential)
  } catch (error) {
    throw new AuthenticationError(error)
  }
}
