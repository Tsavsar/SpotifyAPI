// Drop this file into your Vercel project at: pages/api/recently-played.js
// It uses the same token refresh as now-playing.js
//
// IMPORTANT: You also need to add "user-read-recently-played" to your
// Spotify app's scopes and re-authorise once. In your Spotify Dashboard →
// your app → Edit Settings → Redirect URIs, then re-run whatever auth
// flow you used to get your refresh token.

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
} = process.env

async function getAccessToken() {
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  })
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')

  try {
    const { access_token } = await getAccessToken()

    const r = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=10',
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    if (r.status === 204 || r.status > 400) {
      return res.status(200).json({ tracks: [] })
    }

    const data = await r.json()

    const tracks = (data.items || []).map(item => ({
      title:    item.track.name,
      artist:   item.track.artists.map(a => a.name).join(', '),
      album:    item.track.album.name,
      albumArt: item.track.album.images[0]?.url || '',
      songUrl:  item.track.external_urls.spotify,
      playedAt: item.played_at,
    }))

    res.status(200).json({ tracks })
  } catch (err) {
    console.error(err)
    res.status(500).json({ tracks: [] })
  }
}
