'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

import { env } from '@/constants/env'
import { signInWithOneTap } from '@/services/auth'

import { useAuth } from './auth-provider'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          prompt: () => void
          cancel: () => void
        }
      }
    }
  }
}

const ALLOWED_PATHS = ['/', '/login', '/signup']

export function OneTapProvider() {
  const { user } = useAuth()
  const pathname = usePathname()
  const isAllowedPath = ALLOWED_PATHS.includes(pathname)

  useEffect(() => {
    if (user || !isAllowedPath) {
      window.google?.accounts.id.cancel()
      return
    }

    if (!window.google?.accounts?.id) return

    window.google.accounts.id.initialize({
      client_id: env.googleClientId,
      callback: async ({ credential }) => {
        await signInWithOneTap(credential)
      }
    })
    window.google.accounts.id.prompt()
  }, [pathname, user, isAllowedPath])

  const initOneTap = () => {
    if (!window.google?.accounts?.id || user || !isAllowedPath) return

    window.google.accounts.id.initialize({
      client_id: env.googleClientId,
      callback: async ({ credential }) => {
        await signInWithOneTap(credential)
      }
    })
    window.google.accounts.id.prompt()
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={initOneTap}
    />
  )
}
