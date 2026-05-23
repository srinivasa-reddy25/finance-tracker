'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { buildQueryString } from '../lib/query-string'

type TAction = 'push' | 'replace'

type TParams = Record<string, string>
type TUpdatableParams = Record<string, string | undefined>

export const useQueryParams = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params: TParams = {}

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const navigate = (query: string, action: TAction): void => {
    const href = query ? `?${query}` : pathname

    if (action === 'push') {
      router.push(href, { scroll: false })
      return
    }

    router.replace(href, { scroll: false })
  }

  const updateParam = (
    filterKey: string,
    value: string | undefined,
    action: TAction = 'push'
  ): void => {
    const updatedParams: TUpdatableParams = {
      ...params,
      [filterKey]: value
    }
    navigate(buildQueryString(updatedParams), action)
  }

  const updateParams = (
    newParams: TUpdatableParams,
    action: TAction = 'push'
  ): void => {
    const updatedParams: TUpdatableParams = {
      ...params,
      ...newParams
    }
    navigate(buildQueryString(updatedParams), action)
  }

  const removeParam = (filterKey: string, action: TAction = 'push'): void => {
    const updatedParams: TUpdatableParams = {
      ...params,
      [filterKey]: undefined
    }
    navigate(buildQueryString(updatedParams), action)
  }

  const removeAllParams = (
    excludeKeys: string[] = [],
    action: TAction = 'push'
  ): void => {
    const updatedParams: TUpdatableParams = {}

    excludeKeys.forEach((key) => {
      if (params[key] !== undefined) {
        updatedParams[key] = params[key]
      }
    })

    navigate(buildQueryString(updatedParams), action)
  }

  return { params, updateParam, updateParams, removeParam, removeAllParams }
}
