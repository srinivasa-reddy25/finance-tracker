import { mg } from 'db'
import { log } from 'logging'
import cron from 'node-cron'

import { monthly_report_template } from '@tejadev/email'

import { send_email } from '../mailer.ts'
import { send_push } from '../services/push.ts'

export function start_monthly_report_job(): void {
  cron.schedule('0 9 1 * *', async () => {
    const now = new Date()
    const month = now.getMonth() === 0 ? 12 : now.getMonth()
    const year =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    await run(year, month)
  })
  log.info({ app: 'cron', message: 'Monthly report job scheduled (0 9 1 * *)' })
}

export async function run(year: number, month: number): Promise<void> {
  const month_start = new Date(year, month - 1, 1)
  const month_end = new Date(year, month, 1)
  const prev_start = new Date(year, month - 2, 1)
  const prev_end = new Date(year, month - 1, 1)
  const month_label = month_start.toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric'
  })

  const users = await mg.User.find({ is_active: true }).lean()
  log.info({
    app: 'cron',
    message: `Monthly reports: ${users.length} users for ${month_label}`
  })

  for (const user of users) {
    try {
      const uid = user._id.toString()
      const [expense_agg, income_agg, prev_agg, biggest, budgets] =
        await Promise.all([
          mg.Transaction.aggregate([
            {
              $match: {
                user_id: uid,
                date: { $gte: month_start, $lt: month_end }
              }
            },
            {
              $lookup: {
                from: 'usercategories',
                let: { cat_key: '$category', uid: '$user_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$key', '$$cat_key'] },
                          { $eq: ['$user_id', '$$uid'] }
                        ]
                      }
                    }
                  }
                ],
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
            { $sort: { amount: -1 } }
          ]),
          mg.Transaction.aggregate([
            {
              $match: {
                user_id: uid,
                date: { $gte: month_start, $lt: month_end }
              }
            },
            {
              $lookup: {
                from: 'usercategories',
                let: { cat_key: '$category', uid: '$user_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$key', '$$cat_key'] },
                          { $eq: ['$user_id', '$$uid'] }
                        ]
                      }
                    }
                  }
                ],
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
                let: { cat_key: '$category', uid: '$user_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$key', '$$cat_key'] },
                          { $eq: ['$user_id', '$$uid'] }
                        ]
                      }
                    }
                  }
                ],
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
                date: { $gte: month_start, $lt: month_end }
              }
            },
            {
              $lookup: {
                from: 'usercategories',
                let: { cat_key: '$category', uid: '$user_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$key', '$$cat_key'] },
                          { $eq: ['$user_id', '$$uid'] }
                        ]
                      }
                    }
                  }
                ],
                as: 'cat'
              }
            },
            { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
            { $match: { 'cat.is_income': { $ne: true } } },
            { $sort: { amount: -1 } },
            { $limit: 1 }
          ]),
          mg.UserCategory.find({
            user_id: uid,
            is_income: false,
            budget: { $gt: 0 }
          }).lean()
        ])

      const total_spent = expense_agg.reduce(
        (s: number, c: { amount: number }) => s + c.amount,
        0
      )
      const total_income = income_agg[0]?.total ?? 0
      const prev_spent = prev_agg[0]?.total ?? 0
      const budget = budgets.reduce((s, c) => s + (c.budget ?? 0), 0)

      const { subject, html } = monthly_report_template({
        name: user.name,
        month_label,
        total_spent,
        total_income,
        net_savings: total_income - total_spent,
        budget,
        top_categories: expense_agg
          .slice(0, 3)
          .map(
            (c: {
              _id: string
              name: string
              amount: number
              color: string
            }) => ({
              name: c.name || c._id,
              amount: c.amount,
              color: c.color || '#6B7280'
            })
          ),
        biggest_transaction: biggest[0]
          ? {
              description: biggest[0].description as string,
              amount: biggest[0].amount as number,
              category: biggest[0].cat?.name ?? (biggest[0].category as string)
            }
          : null,
        prev_spent
      })

      await send_email(user.email, subject, html)
      if (user.fcm_token) {
        send_push(
          user.fcm_token,
          `Your ${month_label} report is ready`,
          `You spent ₹${total_spent.toLocaleString('en-IN')} last month. Tap to see the full breakdown.`
        ).catch(() => {})
      }
      log.info({ app: 'cron', message: `Monthly report sent to ${user.email}` })
    } catch (err) {
      log.error({
        app: 'cron',
        message: `Monthly report failed for ${user.email}`,
        meta: { err }
      })
    }
  }
}
