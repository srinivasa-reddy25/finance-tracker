export type TApiResponse<T = unknown> = {
  message: string
  data: T
}

export type TApiError = {
  message: string
  request_id?: string
  status_code: number
  validation_error?: {
    fields: string[]
    details: Array<{
      field: string
      message: string
      code?: string
    }>
  }
}
