const PROXY_BASE = 'http://localhost:3001/api/proxy/stream?url='

export function getProxyUrl(url: string): string {
  return `${PROXY_BASE}${encodeURIComponent(url)}`
}
