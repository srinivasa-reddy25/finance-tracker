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

/**
 * Compute the next run date at or after `from`.
 *
 * Rule: same calendar day as `from` is valid — the cron will pick it up
 * at midnight that night. When advancing AFTER a cron fire, callers must
 * pass tomorrow as `from` so today is excluded.
 */
export function compute_next_run(
  frequency: TRecurrenceFrequency,
  opts: Options,
  from: Date = new Date()
): Date {
  // Normalise to midnight of the calendar day
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())

  switch (frequency) {
    case 'daily': {
      // Fire on `from`'s day itself; caller passes tomorrow when advancing
      return d
    }
    case 'weekly': {
      const target = opts.day_of_week ?? 0
      const current = d.getDay()
      let diff = target - current
      if (diff < 0) diff += 7 // negative = already passed this week → next week
      // diff === 0 means today IS the target day → fire tonight ✓
      const result = new Date(d)
      result.setDate(result.getDate() + diff)
      return result
    }
    case 'monthly': {
      const target = opts.day_of_month ?? 1
      const y = d.getFullYear()
      const m = d.getMonth()
      // Same day is valid (>= not >)
      const this_month = clamp_day(y, m, target)
      if (this_month >= d) return this_month
      const ny = m === 11 ? y + 1 : y
      const nm = m === 11 ? 0 : m + 1
      return clamp_day(ny, nm, target)
    }
    case 'yearly': {
      const m = (opts.month_of_year ?? 1) - 1
      const day = opts.day_of_month ?? 1
      // Same day is valid (>= not >)
      const this_year = clamp_day(d.getFullYear(), m, day)
      if (this_year >= d) return this_year
      return clamp_day(d.getFullYear() + 1, m, day)
    }
  }
}
