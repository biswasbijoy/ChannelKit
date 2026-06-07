export interface EpgEntry {
  channelId: string
  channelName: string
  title: string
  start: Date
  end: Date
  description: string
  category?: string
}

export interface EpgChannel {
  id: string
  name: string
  entries: EpgEntry[]
}

export interface EpgParseResult {
  channels: EpgChannel[]
  errors: { line: number; message: string }[]
  warnings: { line: number; message: string }[]
}
