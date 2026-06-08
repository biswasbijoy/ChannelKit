import { describe, it, expect } from 'vitest'
import { parseM3u } from '../features/playlist/parseM3u'

describe('parseM3u', () => {
  it('parses a valid basic playlist', () => {
    const content = `#EXTM3U
#EXTINF:-1,Channel One
http://example.com/stream1.m3u8
#EXTINF:-1,Channel Two
http://example.com/stream2.m3u8`

    const result = parseM3u(content)
    expect(result.channels).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
    expect(result.channels[0]?.name).toBe('Channel One')
    expect(result.channels[0]?.url).toBe('http://example.com/stream1.m3u8')
    expect(result.channels[1]?.name).toBe('Channel Two')
  })

  it('parses playlist with tvg attributes and groups', () => {
    const content = `#EXTM3U
#EXTINF:-1 tvg-id="bbc.one" tvg-name="BBC One" tvg-logo="http://logo.tv/bbc.png" group-title="UK",BBC One
http://example.com/bbc.m3u8`

    const result = parseM3u(content)
    expect(result.channels).toHaveLength(1)
    const ch = result.channels[0]!
    expect(ch.tvgId).toBe('bbc.one')
    expect(ch.tvgName).toBe('BBC One')
    expect(ch.logo).toBe('http://logo.tv/bbc.png')
    expect(ch.group).toBe('UK')
  })

  it('uses the BD channel category map when group-title is missing', () => {
    const content = `#EXTM3U
#EXTINF:-1 tvg-id="ATNMusic.bd@SD",ATN Music (360p)
http://example.com/atn-music.m3u8`

    const result = parseM3u(content)
    expect(result.channels).toHaveLength(1)
    expect(result.channels[0]?.group).toBe('Music')
  })

  it('keeps playlist group-title over inferred BD channel categories', () => {
    const content = `#EXTM3U
#EXTINF:-1 tvg-id="ATNMusic.bd@SD" group-title="Bangladesh",ATN Music (360p)
http://example.com/atn-music.m3u8`

    const result = parseM3u(content)
    expect(result.channels).toHaveLength(1)
    expect(result.channels[0]?.group).toBe('Bangladesh')
  })

  it('uses the IN channel category map when parsing in.m3u channels', () => {
    const content = `#EXTM3U
#EXTINF:-1 tvg-id="SonyEntertainmentTelevision.in@HD",Sony Entertainment Television HD (1080p)
http://example.com/sony-entertainment.m3u8
#EXTINF:-1 tvg-id="AajTak.in@HD",Aaj Tak HD (1080p)
http://example.com/aaj-tak.m3u8`

    const result = parseM3u(content, 'in.m3u')
    expect(result.channels).toHaveLength(2)
    expect(result.channels[0]?.group).toBe('Entertainment')
    expect(result.channels[1]?.group).toBe('News')
  })

  it('keeps playlist group-title over inferred IN channel categories', () => {
    const content = `#EXTM3U
#EXTINF:-1 tvg-id="SonyEntertainmentTelevision.in@HD" group-title="India",Sony Entertainment Television HD (1080p)
http://example.com/sony-entertainment.m3u8`

    const result = parseM3u(content, 'in.m3u')
    expect(result.channels).toHaveLength(1)
    expect(result.channels[0]?.group).toBe('India')
  })

  it('returns error for missing EXTM3U header', () => {
    const content = `#EXTINF:-1,Channel
http://example.com/stream.m3u8`
    const result = parseM3u(content)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain('EXTM3U')
  })

  it('handles empty content', () => {
    const result = parseM3u('')
    expect(result.errors).toHaveLength(1)
    expect(result.channels).toHaveLength(0)
  })

  it('handles missing stream URLs', () => {
    const content = `#EXTM3U
#EXTINF:-1,Channel One
#EXTINF:-1,Channel Two
http://example.com/valid.m3u8`

    const result = parseM3u(content)
    expect(result.channels).toHaveLength(1)
  })

  it('deduplicates channels by URL+index', () => {
    const content = `#EXTM3U
#EXTINF:-1,Channel One
http://example.com/same.m3u8
#EXTINF:-1,Channel Two
http://example.com/same.m3u8`

    const result = parseM3u(content)
    expect(result.channels).toHaveLength(2)
  })

  it('handles unusual spacing and blank lines', () => {
    const content = `#EXTM3U

#EXTINF:-1,  Channel With Spaces  
http://example.com/space.m3u8

#EXTINF:-1,Another
  http://example.com/another.m3u8  
`
    const result = parseM3u(content)
    expect(result.channels).toHaveLength(2)
    expect(result.channels[0]?.name.trim()).toBe('Channel With Spaces')
  })
})
