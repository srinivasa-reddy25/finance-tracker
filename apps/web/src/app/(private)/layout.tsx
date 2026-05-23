'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { Button, toast } from '@tejadev/ui'
import { ModeToggle } from '@/components/mode-toggle'
import { env } from '@/constants/env'
import { useAuth } from '@/providers/auth-provider'

type TProps = {
  children: ReactNode
}

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  return 'Something went wrong. Please try again.'
}

export default function PrivateLayout({ children }: TProps) {
  const router = useRouter()
  const { user, isLoading, signOut } = useAuth()

  const onLogout = async () => {
    try {
      await signOut()
      toast('Logged out', { description: 'You have been signed out.' })
    } catch (error) {
      toast.error('Logout failed', { description: getErrorMessage(error) })
    }
  }

  useEffect(() => {
    if (isLoading || user) return
    router.replace('/login')
  }, [isLoading, router, user])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-base text-muted-foreground">Loading workspace...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-base text-muted-foreground">Redirecting...</p>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-4xl items-center justify-between p-6 md:px-10 md:pt-10">
        <h1 className="text-3xl font-bold text-primary">
          {env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>
      {children}
    </div>
  )
}
