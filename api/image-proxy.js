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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MediaLog/1.0)' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(response.status).send('Image fetch failed')
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800')

    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
