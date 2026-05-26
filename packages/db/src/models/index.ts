import type { Model } from 'mongoose'

import type {
  TRecurringTransaction,
  TTransaction,
  TUser,
  TUserCategory
} from '@tejadev/shared'

import { recurring_transaction_model } from './recurring-transaction'
import { transaction_model } from './transaction'
import { user_model } from './user'
import { user_category_model } from './user-category'

export type TUserModel = Model<TUser>
export type TTransactionModel = Model<TTransaction>
export type TUserCategoryModel = Model<TUserCategory>
export type TRecurringTransactionModel = Model<TRecurringTransaction>

type TMg = {
  User: TUserModel
  Transaction: TTransactionModel
  UserCategory: TUserCategoryModel
  RecurringTransaction: TRecurringTransactionModel
}

export const mg: TMg = {
  User: user_model,
  Transaction: transaction_model,
  UserCategory: user_category_model,
  RecurringTransaction: recurring_transaction_model
}
