const CLIENT_ID     = 'cd6d0850f7ed49868db3fe9eafe47380'
const CLIENT_SECRET = '55dd99b526ee492191759b310602d1b6'

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
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
    }),
  })
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30')

  const { access_token } = await getAccessToken()

  const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (r.status === 204 || r.status > 400) {
    return res.status(200).json({ isPlaying: false })
  }

  const data = await r.json()

  if (!data.item) {
    return res.status(200).json({ isPlaying: false })
  }

  res.status(200).json({
    isPlaying: data.is_playing,
    title:     data.item.name,
    artist:    data.item.artists.map(a => a.name).join(', '),
    album:     data.item.album.name,
    albumArt:  data.item.album.images[0]?.url || '',
  })
}
