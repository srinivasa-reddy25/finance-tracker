import type { Request, Response } from 'express'

import { mg } from 'db'
import { z } from 'zod'

import { export_ready_template } from '@tejadev/email'

import { send_email } from '../../services/email.ts'
import { build_csv } from '../../services/export/csv.ts'
import { build_pdf } from '../../services/export/pdf.ts'
import { throw_error } from '../../utils/throw-error.ts'

export const export_transactions = async (req: Request, res: Response) => {
  const body = body_schema.safeParse(req.body)
  if (!body.success)
    throw_error(body.error.errors[0]?.message ?? 'Invalid body', 400)

  const { format, range } = body.data!
  const user = req.user
  const user_id = user._id.toString()

  // Resolve date range
  const { from, to, range_label } = resolve_range(range)

  // Fetch transactions with category lookup
  const txs = await mg.Transaction.aggregate([
    {
      $match: {
        user_id,
        ...(from || to
          ? {
              date: {
                ...(from ? { $gte: from } : {}),
                ...(to ? { $lt: to } : {})
              }
            }
          : {})
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
    { $sort: { date: -1 } }
  ])

  if (txs.length === 0) {
    throw_error('No transactions to export for the selected range', 400)
  }

  // Build attachment
  let attachment_content: Buffer
  let attachment_filename: string
  let attachment_type: string

  if (format === 'csv') {
    attachment_content = build_csv(
      txs.map((t) => ({
        date: t.date,
        description: t.description,
        category: t.cat?.name ?? t.category,
        amount: t.amount,
        note: t.note ?? '',
        source: t.source
      }))
    )
    attachment_filename = `finance-tracker-${range}.csv`
    attachment_type = 'text/csv'
  } else {
    let total_spent = 0
    let total_income = 0
    const rows = txs.map((t) => {
      const is_income = t.cat?.is_income === true
      if (is_income) total_income += t.amount
      else total_spent += t.amount
      return {
        date: t.date,
        description: t.description,
        category_name: t.cat?.name ?? t.category,
        category_color: t.cat?.color ?? '#6B7280',
        amount: t.amount,
        is_income
      }
    })

    attachment_content = await build_pdf({
      user_name: user.name,
      range_label,
      total_spent,
      total_income,
      rows
    })
    attachment_filename = `finance-tracker-${range}.pdf`
    attachment_type = 'application/pdf'
  }

  const total_amount = txs.reduce((s, t) => s + t.amount, 0)

  const { subject, html } = export_ready_template({
    name: user.name,
    format,
    range_label,
    transaction_count: txs.length,
    total_amount
  })

  await send_email(user.email, subject, html, [
    {
      filename: attachment_filename,
      content: attachment_content,
      contentType: attachment_type
    }
  ])

  res.json({
    message: 'Export sent to your email',
    data: { transaction_count: txs.length, total_amount }
  })
}

function resolve_range(range: TRange): {
  from: Date | null
  to: Date | null
  range_label: string
} {
  const now = new Date()
  const this_month = new Date(now.getFullYear(), now.getMonth(), 1)

  if (range === 'this_month') {
    const next_month = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return {
      from: this_month,
      to: next_month,
      range_label: this_month.toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric'
      })
    }
  }
  if (range === 'last_month') {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return {
      from: last,
      to: this_month,
      range_label: last.toLocaleString('en-IN', {
        month: 'long',
        year: 'numeric'
      })
    }
  }
  if (range === 'last_3_months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const next_month = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return {
      from: start,
      to: next_month,
      range_label: `Last 3 months (${start.toLocaleString('en-IN', { month: 'short' })} – ${now.toLocaleString('en-IN', { month: 'short', year: 'numeric' })})`
    }
  }
  return { from: null, to: null, range_label: 'All time' }
}

const RANGES = ['this_month', 'last_month', 'last_3_months', 'all'] as const
type TRange = (typeof RANGES)[number]

const body_schema = z.object({
  format: z.enum(['csv', 'pdf']),
  range: z.enum(RANGES)
})
