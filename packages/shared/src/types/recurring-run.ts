export type TRecurringRunStatus = 'success' | 'failed'

export type TRecurringRun = {
  _id?: string
  recurring_id: string
  user_id: string
  status: TRecurringRunStatus
  fired_at: Date
  transaction_id?: string
  error?: string
  amount: number
  name: string
  createdAt?: Date
}
