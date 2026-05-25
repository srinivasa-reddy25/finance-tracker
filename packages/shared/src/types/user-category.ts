export type TUserCategory = {
  _id?: string
  user_id: string
  key: string
  name: string
  icon: string
  color: string
  bg: string
  is_deletable: boolean
  is_income: boolean
  sort_order: number
  budget?: number | null
  createdAt?: Date
  updatedAt?: Date
}
