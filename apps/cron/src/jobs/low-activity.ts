import { mg } from 'db'
import { log } from 'logging'
import cron from 'node-cron'

import { low_activity_template } from '@tejadev/email'

import { send_email } from '../mailer.ts'

const INACTIVE_DAYS = 5

// Daily at 10 AM — nudge users who haven't logged in 5+ days
export function start_low_activity_job(): void {
  cron.schedule('0 10 * * *', async () => {
    await run()
  })
  log.info({
    app: 'cron',
    message: 'Low-activity nudge job scheduled (0 10 * * *)'
  })
}

export async function run(): Promise<void> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS)

  const users = await mg.User.find({ is_active: true }).lean()

  for (const user of users) {
    try {
      const uid = user._id.toString()

      const last_tx = await mg.Transaction.findOne({ user_id: uid })
        .sort({ date: -1 })
        .lean()

      if (!last_tx) continue

      const last_date = new Date(last_tx.date as Date)
      const days_since = Math.floor(
        (Date.now() - last_date.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (days_since < INACTIVE_DAYS) continue

      const cat = await mg.UserCategory.findOne({
        key: last_tx.category,
        user_id: uid
      }).lean()

      const { subject, html } = low_activity_template({
        name: user.name,
        days_since_last: days_since,
        last_transaction_date: last_date.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        last_amount: last_tx.amount as number,
        last_category: cat?.name ?? (last_tx.category as string)
      })

      await send_email(user.email, subject, html)
      log.info({
        app: 'cron',
        message: `Low-activity nudge sent to ${user.email} (${days_since}d inactive)`
      })
    } catch (err) {
      log.error({
        app: 'cron',
        message: `Low-activity nudge failed for ${user.email}`,
        meta: { err }
      })
    }
  }
}
