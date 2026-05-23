import type {
  CATEGORIES,
  TRANSACTION_SOURCES
} from '../constants/categories.js'

export type TCategory = (typeof CATEGORIES)[number]
export type TTransactionSource = (typeof TRANSACTION_SOURCES)[number]

export type TTransaction = {
  user_id: string
  amount: number
  description: string
  category: TCategory
  note?: string
  date: Date
  source: TTransactionSource
  createdAt?: Date
  updatedAt?: Date
}
