import { Schema, model, Types, type Document } from 'mongoose'

interface IChannel {
  id: string
  name: string
  url: string
  group: string
  tvgId: string
  tvgName: string
  logo: string
  rawExtinf: string
  index: number
}

export interface IPlaylist extends Document {
  userId: Types.ObjectId
  name: string
  channels: IChannel[]
  source: 'file' | 'url'
  fileName?: string
  importedAt: Date
}

const channelSchema = new Schema<IChannel>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  group: { type: String, default: '' },
  tvgId: { type: String, default: '' },
  tvgName: { type: String, default: '' },
  logo: { type: String, default: '' },
  rawExtinf: { type: String, default: '' },
  index: { type: Number, required: true },
}, { _id: false })

const playlistSchema = new Schema<IPlaylist>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  channels: { type: [channelSchema], default: [] },
  source: { type: String, enum: ['file', 'url'], default: 'file' },
  fileName: { type: String },
  importedAt: { type: Date, default: Date.now },
})

export const Playlist = model<IPlaylist>('Playlist', playlistSchema)
