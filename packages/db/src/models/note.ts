import { model, Schema } from 'mongoose'
import type { Types } from 'mongoose'

type TNoteDoc = {
  _id: Types.ObjectId
  user_id: Types.ObjectId
  note: string
  createdAt: Date
  updatedAt: Date
}

const note_schema = new Schema<TNoteDoc>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    note: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

export type { TNoteDoc }
export const note_model = model<TNoteDoc>('Note', note_schema)
