const FIELDS = 'key,title,author_name,first_publish_year,cover_i,isbn,subject'

export default async function handler(req, res) {
  const action = req.query.action || 'trending'
  const q = req.query.q || ''

  let url
  if (action === 'search') {
    if (!q.trim()) {
      return res.status(400).json({ error: 'Missing q parameter for search' })
    }
    url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=${FIELDS}`
  } else {
    // Fetch extra rows so we can drop entries without covers and still fill trending picks.
    url = `https://openlibrary.org/search.json?q=fiction&sort=new&limit=40&fields=${FIELDS}`
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MediaLog/1.0 (https://github.com/alsionli/medialog)' },
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
