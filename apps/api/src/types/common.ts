type TValidationError = {
  fields: string[]
  details: Array<{
    field: string
    message: string
    code?: string
  }>
}

export type TErrorResponse = {
  message: string
  request_id?: string
  status_code: number
  validation_error?: TValidationError
}

export type TInternalError = TErrorResponse & {
  stack?: string
  developer_message?: string
}
