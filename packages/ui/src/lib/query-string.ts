type TQueryValue = string | number | boolean | null | undefined

export const buildQueryString = (
  params: Record<string, TQueryValue>
): string => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  return searchParams.toString()
}
