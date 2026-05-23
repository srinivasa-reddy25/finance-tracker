import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type UserCredential
} from 'firebase/auth'

import { auth } from '@/services/firebase'

import { AuthenticationError } from './errors'

export const signInWithEmailPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    return userCredential
  } catch (error) {
    throw new AuthenticationError(error)
  }
}

export const signUpWithEmailPassword = async (
  email: string,
  password: string,
  name: string
): Promise<void> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    await updateProfile(userCredential.user, { displayName: name })
    await sendEmailVerification(userCredential.user)
    await signOut(auth)
  } catch (error) {
    throw new AuthenticationError(error)
  }
}

export const resendVerificationEmail = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('No signed-in user')
    await sendEmailVerification(currentUser)
  } catch (error) {
    throw new AuthenticationError(error)
  }
}

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    throw new AuthenticationError(error)
  }
}
