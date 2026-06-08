import type { Channel, ParseResult } from './playlistTypes'
import bdChannelCategories from '../../data/bdChannelCategories.json'

interface ChannelCategoryData {
  byName: Record<string, string>
  byTvgId: Record<string, string>
}

const categoryData = bdChannelCategories as ChannelCategoryData
const categoriesByNormalizedName = new Map(
  Object.entries(categoryData.byName).map(([name, category]) => [
    normalizeChannelName(name),
    category,
  ]),
)

export function parseM3u(content: string, fileName?: string): ParseResult {
  const channels: Channel[] = []
  const errors: ParseResult['errors'] = []
  const warnings: ParseResult['warnings'] = []

  const lines = content.split(/\r?\n/)
  if (lines.length === 0 || !lines[0]?.startsWith('#EXTM3U')) {
    errors.push({ line: 0, message: 'Missing #EXTM3U header' })
    return { channels, errors, warnings }
  }

  const seen = new Set<string>()
  let currentExtinf: string | null = null
  let currentIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? ''
    if (line === '' || line.startsWith('#EXTM3U')) continue

    if (line.startsWith('#EXTINF:')) {
      currentExtinf = line
      continue
    }

    if (line.startsWith('#')) continue

    if (line.startsWith('http://') || line.startsWith('https://')) {
      const url = line
      const channel = parseChannel(url, currentExtinf, currentIndex, fileName)

      const dedupKey = `${url}|${channel.index}`
      if (seen.has(dedupKey)) {
        warnings.push({ line: i, message: `Duplicate channel skipped: ${channel.name}` })
        currentExtinf = null
        continue
      }
      seen.add(dedupKey)

      channels.push(channel)
      currentIndex++
      currentExtinf = null
    } else if (line.startsWith('http')) {
      warnings.push({ line: i, message: `Non-HTTP(S) URL skipped: ${line.slice(0, 50)}` })
      currentExtinf = null
    }
  }

  if (channels.length === 0 && errors.length === 0) {
    errors.push({ line: 0, message: 'No valid stream URLs found in playlist' })
  }

  return { channels, errors, warnings }
}

function parseChannel(
  url: string,
  extinf: string | null,
  index: number,
  fileName?: string,
): Channel {
  const name = extractName(extinf) || fileName || 'Unknown Channel'
  const tvgId = extractAttribute(extinf, 'tvg-id') || ''
  const tvgName = extractAttribute(extinf, 'tvg-name') || ''
  const logo = extractAttribute(extinf, 'tvg-logo') || ''
  const explicitGroup = extractAttribute(extinf, 'group-title')
  const inferredGroup = inferChannelCategory(name, tvgId, tvgName)
  const group = explicitGroup && explicitGroup.toLowerCase() !== 'uncategorized'
    ? explicitGroup
    : inferredGroup ?? 'Uncategorized'

  return {
    id: `ch-${index}-${urlToId(url)}`,
    name,
    url,
    group,
    tvgId,
    tvgName,
    logo,
    rawExtinf: extinf ?? '',
    index,
  }
}

function urlToId(url: string): string {
  const hash = url.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0
  }, 0)
  return Math.abs(hash).toString(36)
}

function extractName(extinf: string | null): string | undefined {
  if (!extinf) return undefined
  const commaIndex = extinf.lastIndexOf(',')
  if (commaIndex === -1) return undefined
  return extinf.slice(commaIndex + 1).trim() || undefined
}

function extractAttribute(extinf: string | null, attr: string): string | undefined {
  if (!extinf) return undefined
  const regex = new RegExp(`${attr}="([^"]*)"`, 'i')
  const match = extinf.match(regex)
  return match?.[1] ?? undefined
}

export function inferChannelCategory(
  name: string,
  tvgId: string,
  tvgName: string,
): string | undefined {
  if (tvgId && categoryData.byTvgId[tvgId]) {
    return categoryData.byTvgId[tvgId]
  }

  const nameCategory = categoriesByNormalizedName.get(normalizeChannelName(name))
  if (nameCategory) return nameCategory

  if (tvgName) {
    return categoriesByNormalizedName.get(normalizeChannelName(tvgName))
  }

  return undefined
}

export function applyBdCategoryMapping(channels: Channel[], fileName?: string | null): Channel[] {
  if (!fileName?.toLowerCase().startsWith('bd')) return channels
  return channels.map((ch) => {
    const inferred = inferChannelCategory(ch.name, ch.tvgId, ch.tvgName)
    if (inferred && (!ch.group || ch.group.toLowerCase() === 'uncategorized')) {
      return { ...ch, group: inferred }
    }
    return ch
  })
}

function normalizeChannelName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
