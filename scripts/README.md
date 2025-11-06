# OAuth Callback Server

This is a simple Express server that handles OAuth callbacks for the Portal Usuarios mobile app during development.

## Purpose

When using `http://localhost:8080/callback` as the redirect URI, GUB.UY redirects the browser to this URL with OAuth parameters (authorization code, state, etc.). Since mobile apps can't directly handle HTTP URLs like web apps, this server:

1. **Captures the OAuth callback** from GUB.UY
2. **Stores the callback data** temporarily in memory
3. **Serves HTML pages** to show success/error to the user
4. **Provides an API** for the mobile app to poll and retrieve the callback data

## How It Works

```
1. User clicks "Login with GUB.UY" in mobile app
2. Browser opens GUB.UY login page
3. User authenticates with GUB.UY
4. GUB.UY redirects browser to: http://localhost:8080/callback?code=XXX&state=YYY
5. This server captures the code and state
6. Server serves a success page to the user
7. Mobile app polls http://localhost:8080/callback-data
8. Mobile app retrieves the code and state
9. Mobile app exchanges code for tokens
10. Authentication complete!
```

## API Endpoints

### GET `/callback`
- **Purpose:** Handles OAuth callback from GUB.UY
- **Parameters:** `code`, `state`, `error`, `error_description`
- **Response:** Redirects to success or error page

### GET `/callback-data`
- **Purpose:** Mobile app polls this to get callback data
- **Response:** `{ code?: string, state?: string, error?: string }` or `{ status: 'waiting' }`

### POST `/clear-callback`
- **Purpose:** Clears callback data after mobile app consumes it
- **Response:** `{ success: true }`

### GET `/health`
- **Purpose:** Health check endpoint
- **Response:** Server status and timestamp

## Running the Server

```bash
pnpm oauth-server
```

The server runs on `http://localhost:8080`.

## Files

- `scripts/oauth-callback-server.ts` - Main server code
- `scripts/public/success.html` - Success page shown after authentication
- `scripts/public/error.html` - Error page shown if authentication fails

## Security Notes

- This server is for **development only**
- In production, use proper deep linking (custom URL schemes)
- The server stores data in memory only (not persistent)
- No authentication or authorization on endpoints
- Callback data is cleared after being consumed

## Troubleshooting

### Server not starting
- Make sure port 8080 is not in use
- Check that all dependencies are installed

### Mobile app can't connect
- Ensure both devices are on the same network
- Use your computer's IP address instead of localhost
- Check firewall settings

### Callback not working
- Verify GUB.UY redirect URI is set to `http://localhost:8080/callback`
- Check server logs for incoming requests
- Ensure the server is running before starting authentication