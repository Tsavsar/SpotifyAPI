// Add this to your GitHub repo as: api/callback.js
// Then add https://spotify-api-lilac.vercel.app/api/callback to your Spotify redirect URIs

const CLIENT_ID     = 'cd6d0850f7ed49868db3fe9eafe47380'
const CLIENT_SECRET = '55dd99b526ee492191759b310602d1b6'
const REDIRECT_URI  = 'https://spotify-api-lilac.vercel.app/api/callback'

export default async function handler(req, res) {
  const code = req.query.code

  if (!code) {
    return res.send('No code received.')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })

  const data = await response.json()

  res.send(`
    <html><body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:0 24px">
      <h2>✅ Your new Refresh Token</h2>
      <p style="font-size:13px;color:#666">Copy this and paste it into Vercel → Environment Variables → SPOTIFY_REFRESH_TOKEN</p>
      <p style="word-break:break-all;font-family:monospace;background:#f5f5f5;padding:16px;border-radius:6px;font-size:13px">
        ${data.refresh_token || 'Error: ' + JSON.stringify(data)}
      </p>
    </body></html>
  `)
}
