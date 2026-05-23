'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/providers/auth-provider'

type TProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: TProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading || !user) return
    router.replace('/home')
  }, [isLoading, router, user])

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-base text-muted-foreground">Redirecting...</p>
      </main>
    )
  }

  return <>{children}</>
}
