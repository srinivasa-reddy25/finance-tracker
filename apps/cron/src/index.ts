import { connect_db } from 'db'
import { log } from 'logging'

import { env } from './constants/env.ts'
import { start_low_activity_job } from './jobs/low-activity.ts'
import { start_monthly_report_job } from './jobs/monthly-report.ts'
import { start_recurring_job } from './jobs/recurring.ts'
import { start_weekly_summary_job } from './jobs/weekly-summary.ts'
import { init_firebase } from './services/firebase.ts'

async function main() {
  log.info({ app: 'cron', message: `Starting cron service [${env.node_env}]` })

  await connect_db()
  await init_firebase()
  log.info({ app: 'cron', message: 'DB connected' })

  start_recurring_job()
  start_monthly_report_job()
  start_weekly_summary_job()
  start_low_activity_job()

  log.info({ app: 'cron', message: 'All jobs scheduled' })
}

main().catch((err) => {
  log.error({ app: 'cron', message: 'Startup failed', meta: { err } })
  process.exit(1)
})
