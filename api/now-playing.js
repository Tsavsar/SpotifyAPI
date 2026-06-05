const CLIENT_ID     = 'cd6d0850f7ed49868db3fe9eafe47380'
const CLIENT_SECRET = '55dd99b526ee492191759b310602d1b6'
const REFRESH_TOKEN = 'AQDpiP_1AxanoamW8P62bhw1djZYP8ePMF1nIuHhh8vlVy1EYos8vg3euOhLosNQVxJUozHdrqL0XbihChishwwgvkDDkNl-z9mxIVvSgMrJhXqR7e5gYWjX37VIQ83daUk'

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
  res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10')

  const { access_token } = await getAccessToken()

  // Try currently-playing first
  const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (r.status !== 204 && r.ok) {
    const data = await r.json()
    if (data?.item) {
      return res.status(200).json({
        isPlaying: data.is_playing,
        title:     data.item.name,
        artist:    data.item.artists.map(a => a.name).join(', '),
        album:     data.item.album.name,
        albumArt:  data.item.album.images[0]?.url || '',
        songUrl:   data.item.external_urls?.spotify || '',
      })
    }
  }

  // Fall back to player state (catches paused tracks)
  const r2 = await fetch('https://api.spotify.com/v1/me/player', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (r2.status !== 204 && r2.ok) {
    const data2 = await r2.json()
    if (data2?.item) {
      return res.status(200).json({
        isPlaying: data2.is_playing,
        title:     data2.item.name,
        artist:    data2.item.artists.map(a => a.name).join(', '),
        album:     data2.item.album.name,
        albumArt:  data2.item.album.images[0]?.url || '',
        songUrl:   data2.item.external_urls?.spotify || '',
      })
    }
  }

  // Nothing playing — return most recently played track
  const r3 = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (r3.ok) {
    const data3 = await r3.json()
    const last = data3?.items?.[0]?.track
    if (last) {
      return res.status(200).json({
        isPlaying: false,
        title:     last.name,
        artist:    last.artists.map(a => a.name).join(', '),
        album:     last.album.name,
        albumArt:  last.album.images[0]?.url || '',
        songUrl:   last.external_urls?.spotify || '',
      })
    }
  }

  res.status(200).json({ isPlaying: false })
}
