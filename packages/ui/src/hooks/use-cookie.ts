'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false

    for (let index = 0; index < a.length; index += 1) {
      if (!deepEqual(a[index], b[index])) return false
    }

    return true
  }

  if (isObject(a) && isObject(b)) {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)

    if (aKeys.length !== bKeys.length) return false

    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false
      if (!deepEqual(a[key], b[key])) return false
    }

    return true
  }

  return false
}

type TCookieOptions = {
  maxAge?: number
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

type TCookieValue = unknown

type TUseCookieReturn = {
  cookie: Record<string, TCookieValue>
  setCookie: (
    name: string,
    value: TCookieValue,
    options?: TCookieOptions
  ) => void
  deleteCookie: (
    name: string,
    options?: Pick<TCookieOptions, 'path' | 'domain'>
  ) => void
  isLoading: boolean
}

export const useCookie = (): TUseCookieReturn => {
  const [cookie, setCookieState] = useState<Record<string, TCookieValue>>({})
  const [isLoading, setIsLoading] = useState(true)
  const initializedRef = useRef(false)

  const parseCookieValue = useCallback((value: string): TCookieValue => {
    if (!value) return ''
    if (value === 'true') return true
    if (value === 'false') return false

    try {
      return JSON.parse(value) as TCookieValue
    } catch {
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        const numericValue = Number(value)
        if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
          return numericValue
        }
      }

      return value
    }
  }, [])

  const stringifyCookieValue = useCallback((value: TCookieValue): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value)
    }
    if (typeof value === 'string') return value
    return JSON.stringify(value)
  }, [])

  const getAllCookies = useCallback((): Record<string, TCookieValue> => {
    if (typeof document === 'undefined') return {}

    try {
      const parsedCookies: Record<string, TCookieValue> = {}
      const entries = document.cookie.split(';')

      entries.forEach((entry) => {
        const trimmed = entry.trim()
        if (!trimmed) return

        const equalIndex = trimmed.indexOf('=')
        if (equalIndex <= 0) return

        const name = trimmed.slice(0, equalIndex)
        const value = trimmed.slice(equalIndex + 1)

        try {
          parsedCookies[name] = parseCookieValue(decodeURIComponent(value))
        } catch {
          parsedCookies[name] = value
        }
      })

      return parsedCookies
    } catch {
      return {}
    }
  }, [parseCookieValue])

  const buildCookieString = useCallback(
    (name: string, value: string, options: TCookieOptions = {}): string => {
      const parts = [`${name}=${encodeURIComponent(value)}`]

      if (options.maxAge !== undefined) {
        parts.push(`max-age=${options.maxAge}`)
      }

      parts.push(`path=${options.path ?? '/'}`)

      if (options.domain) {
        parts.push(`domain=${options.domain}`)
      }

      if (
        options.secure ||
        (typeof window !== 'undefined' && window.location.protocol === 'https:')
      ) {
        parts.push('Secure')
      }

      parts.push(`SameSite=${options.sameSite ?? 'Lax'}`)

      return parts.join('; ')
    },
    []
  )

  const setCookie = useCallback(
    (name: string, value: TCookieValue, options: TCookieOptions = {}) => {
      if (typeof document === 'undefined' || !name) return

      const cookieValue = stringifyCookieValue(value)
      const normalizedOptions: TCookieOptions = {
        maxAge: DEFAULT_COOKIE_MAX_AGE,
        ...options
      }

      document.cookie = buildCookieString(name, cookieValue, normalizedOptions)

      setCookieState((previous) => ({
        ...previous,
        [name]: value
      }))
    },
    [stringifyCookieValue, buildCookieString]
  )

  const deleteCookie = useCallback(
    (name: string, options: Pick<TCookieOptions, 'path' | 'domain'> = {}) => {
      setCookie(name, '', { ...options, maxAge: 0 })

      setCookieState((previous) => {
        const nextState = { ...previous }
        delete nextState[name]
        return nextState
      })
    },
    [setCookie]
  )

  useEffect(() => {
    if (initializedRef.current) return

    initializedRef.current = true
    setCookieState(getAllCookies())
    setIsLoading(false)
  }, [getAllCookies])

  useEffect(() => {
    const handleStorage = () => {
      setCookieState(getAllCookies())
    }

    const intervalId = window.setInterval(() => {
      if (isLoading || !initializedRef.current) return

      const latestCookies = getAllCookies()
      const latestKeys = Object.keys(latestCookies)
      const stateKeys = Object.keys(cookie)

      const keysChanged =
        latestKeys.length !== stateKeys.length ||
        latestKeys.some((key) => !stateKeys.includes(key))

      const valuesChanged = latestKeys.some(
        (key) => !deepEqual(latestCookies[key], cookie[key])
      )

      if (keysChanged || valuesChanged) {
        setCookieState(latestCookies)
      }
    }, 1000)

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.clearInterval(intervalId)
    }
  }, [cookie, getAllCookies, isLoading])

  return { cookie, setCookie, deleteCookie, isLoading }
}
