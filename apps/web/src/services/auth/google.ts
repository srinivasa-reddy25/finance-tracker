import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential
} from 'firebase/auth'

import { auth } from '@/services/firebase'

import { AuthenticationError } from './errors'

const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account'
})

export const signInWithGooglePopup = async (): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    return userCredential
  } catch (error) {
    throw new AuthenticationError(error)
  }
}

export const signInWithGoogleRedirect = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider)
  } catch (error) {
    throw new AuthenticationError(error)
  }
}

export const getGoogleRedirectResult =
  async (): Promise<UserCredential | null> => {
    try {
      const result = await getRedirectResult(auth)
      return result
    } catch (error) {
      throw new AuthenticationError(error)
    }
  }

export const getGoogleProvider = (): GoogleAuthProvider => {
  return googleProvider
}
