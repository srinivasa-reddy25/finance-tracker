'use client'

import { useEffect, useRef } from 'react'

type TIntersectionObserverOptions = {
  threshold?: number
  rootMargin?: string
}

type TUseIntersectionObserverProps = {
  callback: () => void
  options?: TIntersectionObserverOptions
}

export const useIntersectionObserver = ({
  callback,
  options
}: TUseIntersectionObserverProps) => {
  const targetRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        if (entry.isIntersecting) {
          callbackRef.current()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options
      }
    )

    const currentTarget = targetRef.current

    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
      observer.disconnect()
    }
  }, [options])

  return targetRef
}
