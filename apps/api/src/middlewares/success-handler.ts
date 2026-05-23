import type { NextFunction, Request, Response } from 'express'

import { log } from 'logging'

import { env } from '../constants/env.ts'
import { extract_user_agent_info } from '../utils/functions.ts'

export const success_handler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const original_json = res.json

  res.json = function (json: unknown): Response {
    if (Number(res.statusCode) < 400) {
      const device_info = extract_user_agent_info(req)
      const forwarded_for = req.headers['x-forwarded-for']
      const ip_from_proxy = Array.isArray(forwarded_for)
        ? forwarded_for[0]
        : forwarded_for
      const ip =
        env.node_env === 'dev'
          ? 'localhost'
          : req.ip || req.socket.remoteAddress || ip_from_proxy || 'unknown'

      const message =
        typeof json === 'object' && json !== null && 'message' in json
          ? String(
              (json as { message?: unknown }).message ?? 'Successful request'
            )
          : 'Successful request'

      log.info({
        message,
        app: 'TEJADEV-API',
        meta: {
          req: {
            request_id: req.request_id,
            path: `[${req.method}] ${req.originalUrl}`,
            query: req.query,
            ip
          },
          res: {
            status: res.statusCode
          },
          device_info: env.node_env === 'prod' ? device_info : undefined
        }
      })
    }

    return original_json.call(this, json)
  }

  next()
}
