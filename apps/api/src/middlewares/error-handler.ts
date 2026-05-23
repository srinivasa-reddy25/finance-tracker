import type { NextFunction, Request, Response } from 'express'

import { log } from 'logging'
import { ZodError } from 'zod'
import { generateErrorMessage } from 'zod-error'

import { env } from '../constants/env.ts'
import type { TErrorResponse, TInternalError } from '../types/common.ts'
import CustomError from '../utils/CustomError.ts'
import { extract_user_agent_info } from '../utils/functions.ts'

const error_handler = (
  err: Error | ZodError | CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let internal_error: TInternalError

  if (err instanceof ZodError) {
    internal_error = { ...handle_zod_error(err), stack: err.stack }
  } else if (err instanceof CustomError) {
    internal_error = {
      message: err.message,
      status_code: err.status_code,
      stack: err.stack
    }
  } else {
    internal_error = {
      message: err.message || 'Unknown error occurred',
      status_code: 500,
      stack: err.stack,
      developer_message: err.message
    }
  }

  send_error_as_response(internal_error, req, res)
}

const handle_zod_error = (err: ZodError): TErrorResponse => {
  const invalid_fields = err.issues.map((error) => error.path.join('.'))
  const formatted_message = generateErrorMessage(err.issues, {
    maxErrors: 1,
    path: { enabled: false },
    code: { enabled: false },
    message: {
      enabled: true,
      label: ''
    }
  })

  return {
    message:
      formatted_message ||
      'Invalid input. Please check your entries and try again.',
    status_code: 400,
    validation_error: {
      fields: invalid_fields,
      details: err.issues.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code
      }))
    }
  }
}

const send_error_as_response = (
  err: TInternalError,
  req: Request,
  res: Response
): void => {
  const stack_for_log = err.stack

  const error_response: TErrorResponse = {
    message: err.message || 'Unknown error occurred',
    request_id: req.request_id,
    status_code: err.status_code || 500,
    validation_error: env.node_env === 'prod' ? undefined : err.validation_error
  }

  const should_notify_slack =
    env.node_env === 'prod' && error_response.status_code >= 500
  const device_info = extract_user_agent_info(req)
  const forwarded_for = req.headers['x-forwarded-for']
  const ip_from_proxy = Array.isArray(forwarded_for)
    ? forwarded_for[0]
    : forwarded_for

  log.error({
    message: err.developer_message || error_response.message || 'Unknown error',
    app: 'TEJADEV-API',
    notify_on_slack: should_notify_slack,
    meta: {
      req: {
        request_id: req.request_id,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        full_url: req.originalUrl,
        ip: req.ip || req.socket.remoteAddress || ip_from_proxy || 'unknown'
      },
      res: {
        status: error_response.status_code,
        json: {
          message: error_response.message,
          validation_error: error_response.validation_error
        }
      },
      stack: stack_for_log,
      device_info: env.node_env === 'prod' ? device_info : undefined
    }
  })

  res.status(error_response.status_code).json(error_response)
}

export default error_handler
