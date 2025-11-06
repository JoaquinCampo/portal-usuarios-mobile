import * as Crypto from 'expo-crypto';

/**
 * Generate a cryptographically secure random string
 * @param length Number of bytes for the random string
 * @returns Base64URL encoded random string
 */
export function generateRandomString(length: number = 32): string {
  const randomBytes = Crypto.getRandomBytes(length);
  return base64UrlEncode(randomBytes);
}

/**
 * Generate PKCE code challenge from code verifier
 * @param codeVerifier The code verifier string
 * @returns Base64URL encoded SHA-256 hash
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return base64UrlFromBase64(hash);
}

/**
 * Convert Uint8Array to Base64URL encoding
 */
function base64UrlEncode(buffer: Uint8Array): string {
  // Convert Uint8Array to binary string
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  
  // Convert to base64
  const base64 = btoa(binary);
  
  // Convert to base64url
  return base64UrlFromBase64(base64);
}

/**
 * Convert standard Base64 to Base64URL encoding
 */
function base64UrlFromBase64(base64: string): string {
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert Base64URL to standard Base64
 */
export function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  
  return base64;
}
