import { signOut as firebaseSignOut, type User } from 'firebase/auth'

import { auth } from '@/services/firebase'

import { AuthenticationError } from './errors'

export * from './email-password'
export * from './errors'
export * from './google'
export * from './one-tap'

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    throw new AuthenticationError(error)
  }
}

export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null
}

export const waitForAuthInit = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })
}
