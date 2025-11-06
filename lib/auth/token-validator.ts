import type { OpenIdConfiguration } from '@/lib/types';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
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
    jwksCache = createRemoteJWKSet(new URL(GUBUY_CONFIG.jwksUrl));
  }
  return jwksCache;
}

/**
 * Verify ID token signature and validate claims
 */
export async function verifyIdToken(idToken: string): Promise<JWTPayload> {
  const config = await getOpenIdConfiguration();
  const jwks = await getJwks();

  try {
    // Verify signature with remote JWKS
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: config.issuer,
      audience: GUBUY_CONFIG.clientId,
    });

    // Additional claims validation with flexible issuer matching
    validateIdTokenClaims(payload, config);

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
