import type { Model } from 'mongoose'

import type {
  TBudget,
  TTransaction,
  TUser,
  TUserCategory
} from '@tejadev/shared'

import { budget_model } from './budget'
import { transaction_model } from './transaction'
import { user_model } from './user'
import { user_category_model } from './user-category'

export type TUserModel = Model<TUser>
export type TTransactionModel = Model<TTransaction>
export type TBudgetModel = Model<TBudget>
export type TUserCategoryModel = Model<TUserCategory>

type TMg = {
  User: TUserModel
  Transaction: TTransactionModel
  Budget: TBudgetModel
  UserCategory: TUserCategoryModel
}

export const mg: TMg = {
  User: user_model,
  Transaction: transaction_model,
  Budget: budget_model,
  UserCategory: user_category_model
}
