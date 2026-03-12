export default async function handler(req, res) {
  const apiKey = process.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' })
  }

  const q = req.query.q || req.query.query
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter' })
  }

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(q)}&include_adult=false`

  try {
    const response = await fetch(url)
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
