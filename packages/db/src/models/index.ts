import type { Model } from 'mongoose'

import type { TTransaction, TUser } from '@tejadev/shared'

import { transaction_model } from './transaction'
import { user_model } from './user'

export type TUserModel = Model<TUser>
export type TTransactionModel = Model<TTransaction>

type TMg = {
  User: TUserModel
  Transaction: TTransactionModel
}

export const mg: TMg = {
  User: user_model,
  Transaction: transaction_model
}
