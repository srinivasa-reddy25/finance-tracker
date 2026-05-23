import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { OneTapProvider } from '@/providers/one-tap-provider'
import { QueryProvider } from '@/providers/query-provider'
import { ToasterProvider } from '@/providers/toaster-provider'

import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | TejaDev',
    default: 'TejaDev'
  },
  description:
    'A production-ready Turborepo monorepo template. Auth, database, UI, logging, and tooling — wired and working before you start.',
  metadataBase: new URL('https://teja-reddy.me'),
  openGraph: {
    title: 'TejaDev — Ship the Feature. Not the Setup.',
    description:
      'A production-ready Turborepo monorepo template. Auth, database, UI, logging, and tooling — wired and working before you start.',
    url: 'https://teja-reddy.me',
    siteName: 'TejaDev',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TejaDev — Ship the Feature. Not the Setup.'
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TejaDev — Ship the Feature. Not the Setup.',
    description:
      'A production-ready Turborepo monorepo template. Auth, database, UI, logging, and tooling — wired and working before you start.',
    images: ['/og-image.png']
  }
}

type TProps = {
  children: ReactNode
}

export default function RootLayout({ children }: TProps) {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <ThemeProvider enableSystem attribute="class" defaultTheme="system">
          <QueryProvider>
            <AuthProvider>
              <OneTapProvider />
              {children}
            </AuthProvider>
          </QueryProvider>
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
