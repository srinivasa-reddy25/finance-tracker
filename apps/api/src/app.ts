import { createServer } from 'http'
import type { NextFunction, Request, Response } from 'express'
import express, { json, urlencoded } from 'express'
import { rateLimit } from 'express-rate-limit'

import cors from 'cors'
import helmet from 'helmet'

import 'express-async-errors'

import fileUpload from 'express-fileupload'

import { get_db_status } from 'db'
import morgan from 'morgan'

import { env } from './constants/env.ts'
import error_handler from './middlewares/error-handler.ts'
import { request_id_handler } from './middlewares/request-id.ts'
import { success_handler } from './middlewares/success-handler.ts'
import { ai_router } from './routes/ai.ts'
import { auth_router } from './routes/auth.ts'
import { transactions_router } from './routes/transactions.ts'
import CustomError from './utils/CustomError.ts'

const app = express()
const httpServer = createServer(app)

const rate_limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
})

app.use(helmet())
app.use(cors())
app.use(rate_limiter)
app.use(json())
app.use(urlencoded({ extended: true }))
app.use(morgan(env.node_env === 'prod' ? 'combined' : 'dev'))
app.use(fileUpload({ createParentPath: true }))

app.use(request_id_handler)
app.use(success_handler)

app.get('/api/v1', (_req: Request, res: Response) => {
  const mem = process.memoryUsage()
  res.json({
    message: 'finance-tracker api is running',
    data: {
      status: 'ok',
      environment: env.node_env,
      uptime_seconds: Math.floor(process.uptime()),
      db_status: get_db_status(),
      memory_mb: {
        heap_used: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total: Math.round(mem.heapTotal / 1024 / 1024)
      },
      timestamp: new Date().toISOString()
    }
  })
})

app.use('/api/v1/auth', auth_router)
app.use('/api/v1/transactions', transactions_router)
app.use('/api/v1/ai', ai_router)

app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new CustomError(`Route '${req.originalUrl}' not found`, 404))
})

app.use(error_handler)

export { app, httpServer }
