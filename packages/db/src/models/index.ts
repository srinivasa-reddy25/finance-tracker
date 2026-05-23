import type { Model } from 'mongoose'

import type { TUser } from '@tejadev/shared'

import { note_model, type TNoteDoc } from './note'
import { user_model } from './user'

export type TUserModel = Model<TUser>
export type TNoteModel = Model<TNoteDoc>

type TMg = {
  User: TUserModel
  Note: TNoteModel
}

export const mg: TMg = {
  User: user_model,
  Note: note_model
}

export type { TNoteDoc }
