import { randomUUID } from 'crypto'
import type { NextFunction, Request, Response } from 'express'

export const request_id_handler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const incoming_request_id = req.header('x-request-id')
  const request_id = incoming_request_id || randomUUID()

  req.request_id = request_id
  res.setHeader('x-request-id', request_id)

  next()
}
