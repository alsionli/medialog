export default async function handler(req, res) {
  const apiKey = process.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' })
  }

  const type = req.query.type
  const id = req.query.id
  if (!type || !id || !/^(movie|tv)$/.test(type) || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid type or id' })
  }

  const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
