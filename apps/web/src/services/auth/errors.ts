export type TAuthError = {
  code: string
  message: string
}

export const getAuthErrorMessage = (error: any): string => {
  const errorCode = error?.code || ''
  const errorMessage = error?.message || ''

  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
      return 'No account found with this email address.'
    case 'auth/wrong-password':
      return 'Incorrect password.'
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.'
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups for this site.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.'
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. Please try again.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in credentials.'
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with a different account.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth operations.'
    case 'auth/invalid-verification-code':
      return 'Invalid verification code.'
    case 'auth/invalid-verification-id':
      return 'Invalid verification ID.'
    default:
      return (
        errorMessage ||
        'An error occurred during authentication. Please try again.'
      )
  }
}

export class AuthenticationError extends Error {
  code: string

  constructor(error: any) {
    const message = getAuthErrorMessage(error)
    super(message)
    this.name = 'AuthenticationError'
    this.code = error?.code || 'unknown'
  }
}
