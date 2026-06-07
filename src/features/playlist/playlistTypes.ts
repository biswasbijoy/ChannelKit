export interface Channel {
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

export interface ParseResult {
  channels: Channel[]
  errors: ParseError[]
  warnings: ParseWarning[]
}

export interface ParseError {
  line: number
  message: string
}

export interface ParseWarning {
  line: number
  message: string
}

export interface PlaylistRecord {
  id: string
  name: string
  channels: Channel[]
  importedAt: number
  source: 'file' | 'url'
  fileName?: string
}
