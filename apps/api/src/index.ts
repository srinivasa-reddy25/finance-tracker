import { connect_db, disconnect_db } from 'db'
import { log } from 'logging'

import { httpServer } from './app.ts'
import { env } from './constants/env.ts'
import { start_monthly_report_job } from './jobs/monthly-report.job.ts'

const APP = 'tejadev-api'

const start_server = async (): Promise<void> => {
  try {
    await connect_db()

    httpServer.listen(env.API_PORT, () => {
      log.info({
        app: APP,
        message: `listening on http://localhost:${env.API_PORT}`
      })
    })

    start_monthly_report_job()
  } catch (error) {
    log.error({
      app: APP,
      message: 'Failed to start server',
      meta: { error }
    })
    process.exit(1)
  }
}

const graceful_shutdown = async (): Promise<void> => {
  try {
    log.info({ app: APP, message: 'Shutting down gracefully...' })
    await disconnect_db()
    process.exit(0)
  } catch (error) {
    log.error({
      app: APP,
      message: 'Error during shutdown',
      meta: { error }
    })
    process.exit(1)
  }
}

start_server()

process.on('SIGTERM', graceful_shutdown)
process.on('SIGINT', graceful_shutdown)
