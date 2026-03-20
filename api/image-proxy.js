function isAllowedUrl(url) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    return (
      host === 'covers.openlibrary.org' ||
      host === 'image.tmdb.org' ||
      host.endsWith('.mzstatic.com') ||
      host === 'mzstatic.com'
    )
  } catch {
    return false
  }
}

/** Real browser UA — IA / Open Library often reject generic or bot-like agents. */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function looksLikeImageContentType(ct) {
  if (!ct) return true
  const lower = ct.toLowerCase()
  if (lower.includes('text/html')) return false
  if (lower.startsWith('image/')) return true
  if (lower.includes('application/octet-stream')) return true
  return false
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawUrl = req.query.url || req.query.u
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  let targetUrl
  try {
    targetUrl = decodeURIComponent(rawUrl)
  } catch {
    return res.status(400).json({ error: 'Invalid url parameter' })
  }

  if (!isAllowedUrl(targetUrl)) {
    return res.status(403).json({ error: 'URL not allowed' })
  }

  try {
    const parsed = new URL(targetUrl)
    const host = parsed.hostname.toLowerCase()
    const isMzstatic = host.endsWith('.mzstatic.com') || host === 'mzstatic.com'
    const isOpenLibrary = host === 'covers.openlibrary.org'

    const headers = {
      'User-Agent': BROWSER_UA,
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }
    if (isMzstatic) {
      headers.Referer = 'https://music.apple.com/'
    }
    if (isOpenLibrary) {
      headers.Referer = 'https://openlibrary.org/'
    }
    if (host === 'image.tmdb.org') {
      headers.Referer = 'https://www.themoviedb.org/'
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const response = await fetch(targetUrl, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(502).json({ error: `Image fetch failed: ${response.status}` })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!looksLikeImageContentType(contentType)) {
      return res.status(502).json({ error: 'Upstream did not return an image' })
    }

    const outType = contentType.startsWith('image/') ? contentType.split(';')[0].trim() : 'image/jpeg'
    res.setHeader('Content-Type', outType)
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800')

    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    res.status(502).json({ error: err.message || 'Image proxy error' })
  }
}
