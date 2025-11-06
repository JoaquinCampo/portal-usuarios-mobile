import cors from 'cors';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the public directory
app.use(express.static(join(__dirname, 'public')));

// Store the latest callback data (in production, use a proper database)
let latestCallback: { code?: string; state?: string; error?: string } | null = null;

// OAuth callback handler - redirects to mobile app via deep link
app.get('/callback', (req, res) => {
  const { code, state, error, error_description } = req.query;

  console.log('OAuth callback received:', { code, state, error, error_description });

  // Build the deep link URL for the mobile app
  const appScheme = 'portalusuariosmobile://callback';
  
  if (error) {
    // Store error for polling fallback
    latestCallback = {
      error: error as string,
      state: state as string,
    };

    // Redirect browser to app with error
    const deepLink = `${appScheme}?error=${encodeURIComponent(error as string)}&state=${encodeURIComponent(state as string || '')}`;
    console.log('Redirecting to app with error:', deepLink);
    res.redirect(deepLink);
    return;
  }

  if (code && state) {
    // Store callback data for polling fallback
    latestCallback = {
      code: code as string,
      state: state as string,
    };

    // Redirect browser to app with authorization code
    const deepLink = `${appScheme}?code=${encodeURIComponent(code as string)}&state=${encodeURIComponent(state as string)}`;
    console.log('Redirecting to app with code:', deepLink);
    res.redirect(deepLink);
    return;
  }

  // Invalid callback
  console.error('Invalid callback parameters');
  res.status(400).json({ error: 'Invalid callback parameters' });
});

// Endpoint for the mobile app to poll for callback data
app.get('/callback-data', (_req, res) => {
  res.json(latestCallback || { status: 'waiting' });
});

// Clear callback data after it's been consumed
app.post('/clear-callback', (_req, res) => {
  latestCallback = null;
  res.json({ success: true });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OAuth callback server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Callback data: http://localhost:${PORT}/callback-data`);
});
