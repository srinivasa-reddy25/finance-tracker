import type { Request, Response } from 'express'

import { z } from 'zod'

import { send_monthly_reports } from '../../jobs/monthly-report.job.ts'

export const send_monthly_report = async (req: Request, res: Response) => {
  const { year, month } = query_schema.parse(req.query)

  const now = new Date()
  const y =
    year ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
  const m = month ?? (now.getMonth() === 0 ? 12 : now.getMonth())

  await send_monthly_reports(y, m)

  res.json({
    message: `Monthly report triggered for ${y}-${String(m).padStart(2, '0')}`
  })
}

const query_schema = z.object({
  year: z.coerce.number().int().min(2020).max(2099).optional(),
  month: z.coerce.number().int().min(1).max(12).optional()
})
