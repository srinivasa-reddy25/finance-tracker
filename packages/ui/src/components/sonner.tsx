'use client'

import type { CSSProperties } from 'react'
import { useTheme } from 'next-themes'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon
} from 'lucide-react'
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      className="group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />
      }}
      style={
        {
          '--normal-bg': 'hsl(var(--secondary))',
          '--normal-text': 'hsl(var(--secondary-foreground))',
          '--normal-border': 'hsl(var(--primary) / 0.3)',
          '--border-radius': 'var(--radius)'
        } as CSSProperties
      }
      theme={theme as ToasterProps['theme']}
      toastOptions={{
        classNames: {
          title: 'text-primary',
          description: 'text-tertiary',
          actionButton:
            '!bg-primary !text-primary-foreground hover:!bg-primary/90',
          cancelButton: '!bg-accent !text-accent-foreground hover:!bg-accent/90'
        }
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
