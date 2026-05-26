import type {
  CATEGORIES,
  RECURRENCE_FREQUENCIES
} from '../constants/categories.js'

export type TRecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number]
export type TCategory = (typeof CATEGORIES)[number]

export type TRecurringTransaction = {
  _id?: string
  user_id: string
  name: string
  amount: number
  category: TCategory
  frequency: TRecurrenceFrequency
  day_of_month?: number
  day_of_week?: number
  month_of_year?: number
  description?: string
  is_active: boolean
  next_run: Date
  last_run?: Date
  createdAt?: Date
  updatedAt?: Date
}
