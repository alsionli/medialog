const RSS_URL = 'https://rss.marketingtools.apple.com/api/v2/us/music/most-played/12/albums.json'

export default async function handler(req, res) {
  try {
    const response = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'MediaLog/1.0 (https://github.com/alsionli/medialog)' },
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
