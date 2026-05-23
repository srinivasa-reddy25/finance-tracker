'use client'

import type { ReactNode } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/lib/query-client'

type TProps = {
  children: ReactNode
}

export function QueryProvider({ children }: TProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
