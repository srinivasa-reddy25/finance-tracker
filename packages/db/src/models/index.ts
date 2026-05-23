import type { Model } from 'mongoose'

import type { TUser } from '@tejadev/shared'

import { user_model } from './user'

export type TUserModel = Model<TUser>

type TMg = {
  User: TUserModel
}

export const mg: TMg = {
  User: user_model
}
