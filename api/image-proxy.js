const ALLOWED_ORIGINS = [
  'https://covers.openlibrary.org',
  'https://is1-ssl.mzstatic.com',
  'https://is2-ssl.mzstatic.com',
  'https://is3-ssl.mzstatic.com',
  'https://is4-ssl.mzstatic.com',
  'https://is5-ssl.mzstatic.com',
  'https://image.tmdb.org',
]

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url)
    return ALLOWED_ORIGINS.some((origin) => parsed.origin === origin)
  } catch {
    return false
  }
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
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'MediaLog/1.0' },
    })

    if (!response.ok) {
      return res.status(response.status).send('Image fetch failed')
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')

    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
