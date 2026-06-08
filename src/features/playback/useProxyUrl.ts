export function getProxyUrl(url: string): string {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  return `${base}/api/proxy/stream?url=${encodeURIComponent(url)}`
}
