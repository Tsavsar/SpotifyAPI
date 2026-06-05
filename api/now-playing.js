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

function trackFrom(item, isPlaying) {
  return {
    isPlaying,
    title:    item.name,
    artist:   item.artists.map(a => a.name).join(', '),
    album:    item.album.name,
    albumArt: item.album.images[0]?.url || '',
    songUrl:  item.external_urls?.spotify || '',
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10')

  const { access_token } = await getAccessToken()
  const headers = { Authorization: `Bearer ${access_token}` }

  // 1. Check currently playing
  const r1 = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers })
  if (r1.status !== 204 && r1.ok) {
    const d = await r1.json()
    // item can be null briefly between tracks — if playing, fall through to recently-played for track info
    if (d?.item) return res.status(200).json(trackFrom(d.item, d.is_playing))
    if (d?.is_playing) {
      // Playing but no item — grab most recent track and mark as playing
      const r3 = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers })
      if (r3.ok) {
        const d3 = await r3.json()
        const last = d3?.items?.[0]?.track
        if (last) return res.status(200).json(trackFrom(last, true))
      }
    }
  }

  // 2. Full player state
  const r2 = await fetch('https://api.spotify.com/v1/me/player', { headers })
  if (r2.status !== 204 && r2.ok) {
    const d = await r2.json()
    if (d?.item) return res.status(200).json(trackFrom(d.item, d.is_playing))
  }

  // 3. Last played as fallback
  const r3 = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers })
  if (r3.ok) {
    const d3 = await r3.json()
    const last = d3?.items?.[0]?.track
    if (last) return res.status(200).json(trackFrom(last, false))
  }

  res.status(200).json({ isPlaying: false })
}
