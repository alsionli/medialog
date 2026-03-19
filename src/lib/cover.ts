/**
 * In production (Vercel), external cover images may be blocked by referrer/CORS.
 * Use our API proxy to fetch them server-side.
 */
export function getCoverUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  if (!import.meta.env.PROD) return url

  const allowed = [
    'covers.openlibrary.org',
    'is1-ssl.mzstatic.com',
    'is2-ssl.mzstatic.com',
    'is3-ssl.mzstatic.com',
    'is4-ssl.mzstatic.com',
    'is5-ssl.mzstatic.com',
    'image.tmdb.org',
  ]
  try {
    const parsed = new URL(url)
    if (!allowed.some((h) => parsed.hostname === h)) return url
  } catch {
    return url
  }

  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}
