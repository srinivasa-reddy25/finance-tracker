import { mg } from 'db'
import { log } from 'logging'
import cron from 'node-cron'

import { recurring_fired_template } from '@tejadev/email'
import { compute_next_run } from '@tejadev/shared'

import { send_email } from '../mailer.ts'

// Daily at midnight — fire all recurring transactions that are due
export function start_recurring_job(): void {
  cron.schedule('0 0 * * *', async () => {
    await run()
  })
  log.info({ app: 'cron', message: 'Recurring job scheduled (0 0 * * *)' })
}

export async function run(): Promise<void> {
  const now = new Date()

  const due = await mg.RecurringTransaction.find({
    is_active: true,
    next_run: { $lte: now }
  }).lean()

  if (due.length === 0) return

  log.info({
    app: 'cron',
    message: `Recurring: processing ${due.length} due transactions`
  })

  for (const item of due) {
    try {
      await mg.Transaction.create({
        user_id: item.user_id,
        amount: item.amount,
        description: item.name,
        category: item.category,
        note: item.description ?? '',
        date: now,
        source: 'recurring'
      })

      // Pass tomorrow as `from` so today (already fired) is excluded
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const next_run = compute_next_run(
        item.frequency,
        {
          day_of_month: item.day_of_month,
          day_of_week: item.day_of_week,
          month_of_year: item.month_of_year
        },
        tomorrow
      )

      await mg.RecurringTransaction.updateOne(
        { _id: item._id },
        { last_run: now, next_run }
      )

      // Notify user via email — fire-and-forget
      const user = await mg.User.findById(item.user_id).lean()
      const cat = await mg.UserCategory.findOne({
        key: item.category,
        user_id: item.user_id
      }).lean()
      if (user) {
        const next_run_label = next_run.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
        const { subject, html } = recurring_fired_template({
          name: user.name,
          transaction_name: item.name,
          amount: item.amount,
          category: cat?.name ?? item.category,
          next_run_label
        })
        send_email(user.email, subject, html).catch((err) =>
          log.error({
            app: 'cron',
            message: `Recurring email failed for ${user.email}`,
            meta: { err }
          })
        )
      }

      log.info({
        app: 'cron',
        message: `Recurring: "${item.name}" logged for user ${item.user_id}, next at ${next_run.toISOString()}`
      })
    } catch (err) {
      log.error({
        app: 'cron',
        message: `Recurring: failed for "${item.name}" (${item._id})`,
        meta: { err }
      })
    }
  }
}
