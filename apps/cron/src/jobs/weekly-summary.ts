import { mg } from 'db'
import { log } from 'logging'
import cron from 'node-cron'

import { weekly_summary_template } from '@tejadev/email'

import { send_email } from '../mailer.ts'

// Every Monday at 9 AM
export function start_weekly_summary_job(): void {
  cron.schedule('0 9 * * 1', async () => {
    const now = new Date()
    const week_end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const week_start = new Date(week_end)
    week_start.setDate(week_end.getDate() - 7)
    const prev_start = new Date(week_start)
    prev_start.setDate(week_start.getDate() - 7)

    await run(week_start, week_end, prev_start)
  })
  log.info({ app: 'cron', message: 'Weekly summary job scheduled (0 9 * * 1)' })
}

export async function run(
  week_start: Date,
  week_end: Date,
  prev_start: Date
): Promise<void> {
  const prev_end = week_start

  const fmt_date = (d: Date) =>
    d.toLocaleString('en-IN', { day: 'numeric', month: 'short' })
  const week_label = `${fmt_date(week_start)} – ${fmt_date(new Date(week_end.getTime() - 86400000))}`

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const users = await mg.User.find({ is_active: true }).lean()
  log.info({
    app: 'cron',
    message: `Weekly summaries: ${users.length} users for ${week_label}`
  })

  for (const user of users) {
    try {
      const uid = user._id.toString()

      const [expense_agg, income_agg, prev_agg, daily_agg, top_cat, tx_count] =
        await Promise.all([
          mg.Transaction.aggregate([
            {
              $match: {
                user_id: uid,
                date: { $gte: week_start, $lt: week_end }
              }
            },
            {
              $lookup: {
                from: 'usercategories',
                localField: 'category',
                foreignField: 'key',
                as: 'cat'
              }
            },
            { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
            { $match: { 'cat.is_income': { $ne: true } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]),
          mg.Transaction.aggregate([
            {
              $match: {
                user_id: uid,
                date: { $gte: week_start, $lt: week_end }
              }
            },
            {
              $lookup: {
                from: 'usercategories',
                localField: 'category',
                foreignField: 'key',
                as: 'cat'
              }
            },
            { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
            { $match: { 'cat.is_income': true } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]),
          mg.Transaction.aggregate([
            {
              $match: {
                user_id: uid,
                date: { $gte: prev_start, $lt: prev_end }
              }
            },
            {
              $lookup: {
                from: 'usercategories',
                localField: 'category',
                foreignField: 'key',
                as: 'cat'
              }
            },
            { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
            { $match: { 'cat.is_income': { $ne: true } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]),
          mg.Transaction.aggregate([
            {
              $match: {
                user_id: uid,
                date: { $gte: week_start, $lt: week_end }
              }
            },
            {
              $lookup: {
                from: 'usercategories',
                localField: 'category',
                foreignField: 'key',
                as: 'cat'
              }
            },
            { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
            { $match: { 'cat.is_income': { $ne: true } } },
            {
              $group: {
                _id: { $dayOfWeek: '$date' },
                total: { $sum: '$amount' }
              }
            }
          ]),
          mg.Transaction.aggregate([
            {
              $match: {
                user_id: uid,
                date: { $gte: week_start, $lt: week_end }
              }
            },
            {
              $lookup: {
                from: 'usercategories',
                localField: 'category',
                foreignField: 'key',
                as: 'cat'
              }
            },
            { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
            { $match: { 'cat.is_income': { $ne: true } } },
            {
              $group: {
                _id: '$category',
                amount: { $sum: '$amount' },
                name: { $first: '$cat.name' },
                color: { $first: '$cat.color' }
              }
            },
            { $sort: { amount: -1 } },
            { $limit: 1 }
          ]),
          mg.Transaction.countDocuments({
            user_id: uid,
            date: { $gte: week_start, $lt: week_end }
          })
        ])

      if (tx_count === 0) continue

      // $dayOfWeek: 1=Sun, 2=Mon, ..., 7=Sat → remap to Mon-Sun
      const day_map: Record<number, number> = {
        2: 0,
        3: 1,
        4: 2,
        5: 3,
        6: 4,
        7: 5,
        1: 6
      }
      const daily_totals = Array(7).fill(0)
      for (const d of daily_agg) {
        const idx = day_map[d._id as number]
        if (idx !== undefined) daily_totals[idx] = d.total
      }

      const { subject, html } = weekly_summary_template({
        name: user.name,
        week_label,
        total_spent: expense_agg[0]?.total ?? 0,
        total_income: income_agg[0]?.total ?? 0,
        prev_week_spent: prev_agg[0]?.total ?? 0,
        transaction_count: tx_count,
        daily_breakdown: days.map((day, i) => ({
          day,
          amount: daily_totals[i]
        })),
        top_category: top_cat[0]
          ? {
              name: top_cat[0].name || top_cat[0]._id,
              amount: top_cat[0].amount,
              color: top_cat[0].color || '#6B7280'
            }
          : null
      })

      await send_email(user.email, subject, html)
      log.info({ app: 'cron', message: `Weekly summary sent to ${user.email}` })
    } catch (err) {
      log.error({
        app: 'cron',
        message: `Weekly summary failed for ${user.email}`,
        meta: { err }
      })
    }
  }
}
