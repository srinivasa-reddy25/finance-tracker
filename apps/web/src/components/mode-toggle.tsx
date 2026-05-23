'use client'

import { useCallback, useRef } from 'react'
import { useTheme } from 'next-themes'

import { Moon, Sun } from 'lucide-react'
import { flushSync } from 'react-dom'

import { cn } from '@tejadev/ui'

type ModeToggleProps = {
  duration?: number
} & React.ComponentPropsWithoutRef<'button'>

export function ModeToggle({
  className,
  duration = 400,
  ...props
}: ModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const nextTheme = isDark ? 'light' : 'dark'

    if (!document.startViewTransition) {
      setTheme(nextTheme)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)'
      }
    )
  }, [isDark, duration, setTheme])

  return (
    <button
      ref={buttonRef}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-md border border-border',
        className
      )}
      {...props}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
