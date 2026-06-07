import type { EpgChannel, EpgParseResult } from './epgTypes'

export function parseXmltv(xml: string): EpgParseResult {
  const channelsMap = new Map<string, EpgChannel>()
  const errors: EpgParseResult['errors'] = []
  const warnings: EpgParseResult['warnings'] = []

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      errors.push({ line: 0, message: 'Invalid XML: ' + (parseError.textContent ?? 'Unknown error') })
      return { channels: [], errors, warnings }
    }

    const programmeNodes = doc.querySelectorAll('programme')
    const channelNodes = doc.querySelectorAll('channel')

    channelNodes.forEach((chNode) => {
      const id = chNode.getAttribute('id') ?? ''
      const name = chNode.querySelector('display-name')?.textContent ?? id
      if (id) {
        channelsMap.set(id, { id, name, entries: [] })
      }
    })

    programmeNodes.forEach((progNode) => {
      const channelId = progNode.getAttribute('channel') ?? ''
      const title = progNode.querySelector('title')?.textContent ?? 'Unknown'
      const desc = progNode.querySelector('desc')?.textContent ?? ''
      const startStr = progNode.getAttribute('start') ?? ''
      const endStr = progNode.getAttribute('stop') ?? ''
      const category = progNode.querySelector('category')?.textContent ?? undefined

      const start = parseXmltvDate(startStr)
      const end = parseXmltvDate(endStr)

      if (!channelId) {
        warnings.push({ line: 0, message: 'Programme without channel ID' })
        return
      }

      if (!start || !end) {
        warnings.push({
          line: 0,
          message: `Invalid date in programme for channel ${channelId}`,
        })
        return
      }

      let channel = channelsMap.get(channelId)
      if (!channel) {
        channel = { id: channelId, name: channelId, entries: [] }
        channelsMap.set(channelId, channel)
      }

      channel.entries.push({
        channelId,
        channelName: channel.name,
        title,
        start,
        end,
        description: desc,
        category,
      })
    })

    // Sort entries by start time
    channelsMap.forEach((ch) => {
      ch.entries.sort((a, b) => a.start.getTime() - b.start.getTime())
    })
  } catch (err) {
    errors.push({
      line: 0,
      message: err instanceof Error ? err.message : 'Unknown parse error',
    })
  }

  return {
    channels: Array.from(channelsMap.values()),
    errors,
    warnings,
  }
}

function parseXmltvDate(dateStr: string): Date | null {
  if (!dateStr) return null
  // Format: YYYYMMDDHHMMSS +ZZZZ
  const match = dateStr.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?$/,
  )
  if (!match) return null

  const [, year, month, day, hour, min, sec, tz] = match
  const dateStrIso = `${year}-${month}-${day}T${hour}:${min}:${sec}${tz ?? '+0000'}`
  const date = new Date(dateStrIso)
  return isNaN(date.getTime()) ? null : date
}
