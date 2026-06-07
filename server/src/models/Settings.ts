import { Schema, model, type Document } from 'mongoose'

export interface ISettings extends Document {
  userId: Schema.Types.ObjectId
  volume: number
  muted: boolean
}

const settingsSchema = new Schema<ISettings>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  volume: { type: Number, default: 0.5, min: 0, max: 1 },
  muted: { type: Boolean, default: false },
})

export const Settings = model<ISettings>('Settings', settingsSchema)
