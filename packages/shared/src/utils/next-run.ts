import type { TRecurrenceFrequency } from '../types/recurring-transaction.js'

type Options = {
  day_of_month?: number
  day_of_week?: number
  month_of_year?: number
}

function clamp_day(year: number, month: number, day: number): Date {
  const last_day = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, last_day))
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
      const y = d.getFullYear()
      const m = d.getMonth()
      // Try this month — clamping handles short months (e.g. target=31 in April → Apr 30)
      // Must be strictly future; if clamp lands on today or earlier, go to next month
      const this_month = clamp_day(y, m, target)
      if (this_month > d) return this_month
      const ny = m === 11 ? y + 1 : y
      const nm = m === 11 ? 0 : m + 1
      return clamp_day(ny, nm, target)
    }
    case 'yearly': {
      const m = (opts.month_of_year ?? 1) - 1
      const day = opts.day_of_month ?? 1
      // Try this year — must be strictly future
      const this_year = clamp_day(d.getFullYear(), m, day)
      if (this_year > d) return this_year
      return clamp_day(d.getFullYear() + 1, m, day)
    }
  }
}
