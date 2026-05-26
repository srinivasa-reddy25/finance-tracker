import type { TRecurrenceFrequency } from '../types/recurring-transaction.js'

type Options = {
  day_of_month?: number
  day_of_week?: number
  month_of_year?: number
}

export function compute_next_run(
  frequency: TRecurrenceFrequency,
  opts: Options,
  from: Date = new Date()
): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)

  switch (frequency) {
    case 'daily': {
      d.setDate(d.getDate() + 1)
      return d
    }
    case 'weekly': {
      const target = opts.day_of_week ?? 0
      const current = d.getDay()
      let diff = target - current
      if (diff <= 0) diff += 7
      d.setDate(d.getDate() + diff)
      return d
    }
    case 'monthly': {
      const target = opts.day_of_month ?? 1
      const today = d.getDate()
      if (today < target) {
        d.setDate(target)
      } else {
        d.setMonth(d.getMonth() + 1)
        d.setDate(target)
      }
      return d
    }
    case 'yearly': {
      const m = (opts.month_of_year ?? 1) - 1
      const day = opts.day_of_month ?? 1
      const candidate = new Date(d.getFullYear(), m, day)
      if (candidate > d) return candidate
      return new Date(d.getFullYear() + 1, m, day)
    }
  }
}
