export default async function handler(req, res) {
  const apiKey = process.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' })
  }

  const path = req.query.path
  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Missing path' })
  }

  const tmdbPath = path.join('/')
  const url = new URL(`https://api.themoviedb.org/3/${tmdbPath}`)
  url.searchParams.set('api_key', apiKey)
  Object.entries(req.query).forEach(([k, v]) => {
    if (k !== 'path' && v) {
      url.searchParams.set(k, Array.isArray(v) ? v[0] : v)
    }
  })

  try {
    const response = await fetch(url.toString())
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
