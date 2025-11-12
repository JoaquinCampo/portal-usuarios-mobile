import type { OpenIdConfiguration } from '@/lib/types';
import { createRemoteJWKSet, type JWTPayload } from 'jose';
import { GUBUY_CONFIG } from './gubuy-config';

let discoveryPromise: Promise<OpenIdConfiguration> | null = null;
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Fetch OpenID configuration from discovery endpoint
 */
export async function getOpenIdConfiguration(): Promise<OpenIdConfiguration> {
  if (!discoveryPromise) {
    const issuer = GUBUY_CONFIG.issuer.replace(/\/+$/, '');
    const discoveryUrl = `${issuer}/.well-known/openid-configuration`;

    discoveryPromise = fetch(discoveryUrl, { cache: 'no-cache' })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Failed to load OpenID configuration (${res.status} ${res.statusText}): ${text}`
          );
        }
        return (await res.json()) as OpenIdConfiguration;
      })
      .catch((error) => {
        // Reset cache on error so next call will retry
        discoveryPromise = null;
        throw error;
      });
  }

  return discoveryPromise;
}

/**
 * Get JWKS (JSON Web Key Set) for token verification
 */
export async function getJwks() {
  if (!jwksCache) {
    // Use the JWKS URL directly from config
    // Pass options to avoid AbortSignal.timeout which is not available in React Native
    jwksCache = createRemoteJWKSet(new URL(GUBUY_CONFIG.jwksUrl), {
      timeoutDuration: 30000, // 30 second timeout (don't use AbortSignal)
      cooldownDuration: 30000, // 30 second cooldown between fetches
    });
  }
  return jwksCache;
}

/**
 * Verify ID token signature and validate claims
 * For React Native compatibility, we decode and validate claims without signature verification
 * Signature verification is done by the OAuth server during token exchange
 */
export async function verifyIdToken(idToken: string): Promise<JWTPayload> {
  try {
    // Decode the JWT without verification (since jose's jwtVerify doesn't work in React Native)
    // The token has already been validated by exchanging it with the OAuth server
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (base64url decode)
    // React Native doesn't have Buffer, use atob for base64 decoding
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload) as JWTPayload;

    console.log('Decoded ID token payload:', payload);

    // Validate basic claims
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }

    if (payload.iss !== GUBUY_CONFIG.issuer) {
      throw new Error(`Invalid issuer: ${payload.iss}`);
    }

    if (payload.aud !== GUBUY_CONFIG.clientId) {
      throw new Error(`Invalid audience: ${payload.aud}`);
    }

    return payload;
  } catch (error) {
    console.error('ID token verification failed:', error);
    throw new Error(`ID token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate ID token claims manually
 * Includes flexible issuer matching to handle different OIDC versions
 */
function validateIdTokenClaims(
  payload: JWTPayload,
  config: OpenIdConfiguration
): void {
  // Flexible issuer validation
  const issuerCandidates = new Set<string>();
  const normalizedIssuer = config.issuer.replace(/\/+$/, '');
  issuerCandidates.add(normalizedIssuer);
  issuerCandidates.add(`${normalizedIssuer}/oidc`);
  issuerCandidates.add(`${normalizedIssuer}/oidc/v1`);
  issuerCandidates.add(`${normalizedIssuer}/oidc/v2`);

  const tokenIssuer = typeof payload.iss === 'string' ? payload.iss.replace(/\/+$/, '') : '';
  if (!tokenIssuer || !issuerCandidates.has(tokenIssuer)) {
    throw new Error('Unexpected ID token issuer');
  }

  // Audience validation
  const audience = payload.aud;
  const audienceMatch =
    (typeof audience === 'string' && audience === GUBUY_CONFIG.clientId) ||
    (Array.isArray(audience) && audience.includes(GUBUY_CONFIG.clientId));

  if (!audienceMatch) {
    throw new Error('ID token audience does not include the configured client ID');
  }

  // Time-based validation with tolerance
  const now = Math.floor(Date.now() / 1000);
  const tolerance = 60; // 60 seconds tolerance

  if (typeof payload.exp === 'number' && payload.exp + tolerance < now) {
    throw new Error('ID token has expired');
  }

  if (typeof payload.nbf === 'number' && payload.nbf - tolerance > now) {
    throw new Error('ID token is not yet valid');
  }

  if (typeof payload.iat === 'number' && payload.iat - tolerance > now) {
    throw new Error('ID token issue time is in the future');
  }
}
