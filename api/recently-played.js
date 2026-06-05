const CLIENT_ID     = 'cd6d0850f7ed49868db3fe9eafe47380'
const CLIENT_SECRET = '55dd99b526ee492191759b310602d1b6'
const REFRESH_TOKEN = 'AQA72PKIIYIYm7ewLzmUDikypEAFondkyyityyEj9Lqr37CqBKpe4pKbtxxguZbhprGTXPThT2UpMedrIvWy08Ft6foLdz8M20A4VdFU5zoiC1e-2XpXW0amxEvx6YEr7WQ'

async function getAccessToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  })
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')

  const tokenData = await getAccessToken()
  if (!tokenData.access_token) {
    return res.status(200).json({ error: 'Token failed', detail: tokenData })
  }

  const r = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=10',
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  )

  const text = await r.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }

  if (!r.ok) {
    return res.status(200).json({ error: 'Spotify error', status: r.status, detail: data })
  }

  const tracks = (data.items || []).map(item => ({
    title:    item.track.name,
    artist:   item.track.artists.map(a => a.name).join(', '),
    album:    item.track.album.name,
    albumArt: item.track.album.images[0]?.url || '',
    songUrl:  item.track.external_urls.spotify,
    playedAt: item.played_at,
  }))

  res.status(200).json({ tracks })
}
