import type { PortalSession, TokenResponse, UserInfo } from '@/lib/types';
import * as WebBrowser from 'expo-web-browser';
import { GUBUY_CONFIG } from './gubuy-config';
import { generateCodeChallenge, generateRandomString } from './pkce';
import {
    cleanupOAuthStorage,
    clearSession,
    getAndClearCodeVerifier,
    getAndClearNonce,
    getAndClearOAuthState,
    getSession,
    storeCodeVerifier,
    storeNonce,
    storeOAuthState,
    storeSession,
} from './session-manager';
import { verifyIdToken } from './token-validator';

// Enable browser session cleanup on iOS
WebBrowser.maybeCompleteAuthSession();

/**
 * Initiate OAuth login flow with GUB.UY
 */
export async function initiateLogin(): Promise<PortalSession> {
  try {
    // 1. Generate PKCE parameters
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);

    // 2. Store PKCE params securely
    await storeCodeVerifier(codeVerifier);
    await storeOAuthState(state);
    await storeNonce(nonce);

    // 3. Build authorization URL
    const redirectUri = GUBUY_CONFIG.redirectUri;

    const authUrl = buildAuthorizationUrl({
      codeChallenge,
      state,
      nonce,
      redirectUri,
    });

    console.log('Opening authorization URL:', authUrl);
    console.log('Redirect URI:', redirectUri);

    // 4. Open browser for authentication
    // The browser will be redirected to localhost:8080/callback
    // The callback server will then redirect to portalusuariosmobile://callback
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl, 
      'portalusuariosmobile://'
    );

    if (result.type === 'success' && result.url) {
      console.log('Received callback URL:', result.url);
      return await handleCallback(result.url);
    }

    if (result.type === 'cancel') {
      await cleanupOAuthStorage();
      throw new Error('Authentication cancelled by user');
    }

    throw new Error(`Authentication failed: ${result.type}`);
  } catch (error) {
    await cleanupOAuthStorage();
    console.error('Login failed:', error);
    throw error;
  }
}

/**
 * Build authorization URL with all required parameters
 */
function buildAuthorizationUrl(params: {
  codeChallenge: string;
  state: string;
  nonce: string;
  redirectUri: string;
}): string {
  const { codeChallenge, state, nonce, redirectUri } = params;

  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: GUBUY_CONFIG.clientId,
    redirect_uri: redirectUri,
    scope: GUBUY_CONFIG.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    nonce,
  });

  return `${GUBUY_CONFIG.authorizeUrl}?${queryParams.toString()}`;
}

/**
 * Poll the local callback server for OAuth callback data
 * Used when testing on physical devices since the browser can't redirect back to the app
 */
async function pollForCallbackData(): Promise<PortalSession> {
  const maxAttempts = 60; // 60 seconds max
  const pollInterval = 1000; // 1 second

  console.log('Starting to poll for OAuth callback data...');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`Polling attempt ${attempt + 1}/${maxAttempts}...`);
      const response = await fetch('http://192.168.1.104:8080/callback-data', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Server responded with status: ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }

      const data = await response.json();
      console.log('Received data from callback server:', data);

      if (data.code && data.state) {
        console.log('✅ Authentication successful! Processing callback data...');
        // Clear the callback data from server
        await fetch('http://192.168.1.104:8080/clear-callback', { method: 'POST' });
        // Process the callback
        return await handleCallback(`http://192.168.1.104:8080/callback?code=${data.code}&state=${data.state}`);
      }

      if (data.error) {
        console.error('❌ Authentication failed with error:', data.error);
        await cleanupOAuthStorage();
        throw new Error(`Authentication failed: ${data.error}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.warn(`❌ Polling attempt ${attempt + 1} failed:`, error);
      // Continue polling even on network errors
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  console.error('❌ Timeout waiting for OAuth callback data after', maxAttempts, 'attempts');
  await cleanupOAuthStorage();
  throw new Error('Timeout waiting for OAuth callback data. Make sure the OAuth callback server is running on http://192.168.1.104:8080');
}

/**
 * Handle OAuth callback after user authentication
 */
async function handleCallback(callbackUrl: string): Promise<PortalSession> {
  try {
    const params = parseCallbackUrl(callbackUrl);

    // 1. Check for errors
    if (params.error) {
      throw new Error(
        params.error_description || params.error || 'Authentication failed'
      );
    }

    if (!params.code) {
      throw new Error('No authorization code received');
    }

    // 2. Validate state (CSRF protection)
    const storedState = await getAndClearOAuthState();
    if (!storedState || params.state !== storedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // 3. Exchange code for tokens
    const codeVerifier = await getAndClearCodeVerifier();
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const tokens = await exchangeAuthorizationCode(params.code, codeVerifier);

    // 4. Verify ID token
    const payload = await verifyIdToken(tokens.id_token);

    // 5. Validate nonce (replay protection)
    const storedNonce = await getAndClearNonce();
    if (!storedNonce || payload.nonce !== storedNonce) {
      throw new Error('Invalid nonce - possible replay attack');
    }

    // 6. Fetch additional user info
    const userInfo = await fetchUserInfo(tokens.access_token);

    // 7. Create and store session
    const session = createSession(payload, userInfo, tokens);
    await storeSession(session);

    // 8. Clean up temporary storage
    await cleanupOAuthStorage();

    console.log('Authentication successful');
    return session;
  } catch (error) {
    await cleanupOAuthStorage();
    console.error('Callback handling failed:', error);
    throw error;
  }
}

/**
 * Parse OAuth callback URL parameters
 */
function parseCallbackUrl(url: string): Record<string, string> {
  const urlObj = new URL(url);
  const params: Record<string, string> = {};

  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  // Must match the redirect URI used in the authorization request
  const redirectUri = GUBUY_CONFIG.redirectUri;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: GUBUY_CONFIG.clientId,
    code_verifier: codeVerifier,
  });

  // Note: Mobile apps are public clients and should NOT send client_secret

  const response = await fetch(GUBUY_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const json = (await response.json()) as TokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || json.error) {
    const errorMessage = json.error_description || json.error || response.statusText;
    throw new Error(`Token exchange failed: ${errorMessage}`);
  }

  if (!json.id_token) {
    throw new Error('Token response missing id_token');
  }

  return json;
}

/**
 * Fetch user info from userinfo endpoint
 */
async function fetchUserInfo(
  accessToken: string | undefined
): Promise<UserInfo | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(GUBUY_CONFIG.userinfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch user info:', response.statusText);
      return null;
    }

    return (await response.json()) as UserInfo;
  } catch (error) {
    console.warn('Failed to fetch user info:', error);
    return null;
  }
}

/**
 * Create session object from tokens and user info
 */
function createSession(
  tokenClaims: Record<string, unknown>,
  userInfo: UserInfo | null,
  tokens: TokenResponse
): PortalSession {
  // Extract document number with fallbacks
  const documentNumber =
    (userInfo?.numero_documento as string) ||
    (tokenClaims.numero_documento as string) ||
    (tokenClaims.uid as string) ||
    (tokenClaims.sub as string) ||
    'unknown';

  // Extract full name with fallbacks
  const fullName =
    (userInfo?.nombre_completo as string) ||
    (tokenClaims.nombre_completo as string) ||
    [userInfo?.given_name, userInfo?.family_name].filter(Boolean).join(' ') ||
    (tokenClaims.name as string) ||
    (userInfo?.email as string) ||
    documentNumber;

  // Calculate token expiration
  const expiresAt = tokens.expires_in
    ? Date.now() + tokens.expires_in * 1000
    : undefined;

  return {
    healthUser: {
      id: documentNumber,
      name: fullName,
    },
    healthWorker: {
      id: '',
      name: '',
    },
    clinic: {
      id: '',
      name: '',
    },
    access: {
      source: 'GUBUY_OIDC',
      message: 'Authenticated via GUB.UY ID Uruguay',
    },
    issuedAt: new Date().toISOString(),
    tokens: {
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    },
    attributes: {
      numero_documento: documentNumber,
      email: (userInfo?.email as string) || (tokenClaims.email as string),
      nid: (userInfo?.nid as string) || (tokenClaims.nid as string),
      issuer: tokenClaims.iss as string,
      idp: (userInfo?.idp as string) || (tokenClaims.idp as string),
    },
  };
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
  try {
    const session = await getSession();

    // Clear local session first
    await clearSession();
    await cleanupOAuthStorage();

    // Optionally open browser to GUB.UY logout
    if (session?.tokens?.idToken) {
      const logoutUrl = buildLogoutUrl(session.tokens.idToken);
      console.log('Opening logout URL:', logoutUrl);

      // Open browser for logout (fire and forget)
      await WebBrowser.openBrowserAsync(logoutUrl).catch((error) => {
        console.warn('Failed to open logout URL:', error);
      });
    }
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear local session even if remote logout fails
    await clearSession();
    await cleanupOAuthStorage();
  }
}

/**
 * Build logout URL
 */
function buildLogoutUrl(idToken: string): string {
  const queryParams = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: GUBUY_CONFIG.postLogoutRedirectUri,
  });

  return `${GUBUY_CONFIG.logoutUrl}?${queryParams.toString()}`;
}
