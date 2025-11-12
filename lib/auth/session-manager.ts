import { PortalSession } from '@/lib/types';
import * as SecureStore from 'expo-secure-store';
import {
    OAUTH_NONCE_KEY,
    OAUTH_STATE_KEY,
    OAUTH_VERIFIER_KEY,
    SESSION_KEY,
} from './gubuy-config';

/**
 * Store session data securely
 */
export async function storeSession(session: PortalSession): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to store session:', error);
    throw new Error('Failed to store session securely');
  }
}

/**
 * Get current session from secure storage
 * Returns null if no session exists or if session is expired
 */
export async function getSession(): Promise<PortalSession | null> {
  try {
    const data = await SecureStore.getItemAsync(SESSION_KEY);
    if (!data) {
      return null;
    }

    const session = JSON.parse(data) as PortalSession;

    // Check if token is expired
    if (session.tokens?.expiresAt) {
      if (Date.now() >= session.tokens.expiresAt) {
        console.log('Session token expired, clearing session');
        await clearSession();
        return null;
      }
    }

    return session;
  } catch (error) {
    console.error('Failed to retrieve session:', error);
    return null;
  }
}

/**
 * Clear session data
 */
export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Store OAuth state for CSRF protection
 */
export async function storeOAuthState(state: string): Promise<void> {
  await SecureStore.setItemAsync(OAUTH_STATE_KEY, state);
}

/**
 * Get and remove OAuth state
 */
export async function getAndClearOAuthState(): Promise<string | null> {
  const state = await SecureStore.getItemAsync(OAUTH_STATE_KEY);
  if (state) {
    await SecureStore.deleteItemAsync(OAUTH_STATE_KEY);
  }
  return state;
}

/**
 * Store PKCE code verifier
 */
export async function storeCodeVerifier(verifier: string): Promise<void> {
  await SecureStore.setItemAsync(OAUTH_VERIFIER_KEY, verifier);
}

/**
 * Get and remove PKCE code verifier
 */
export async function getAndClearCodeVerifier(): Promise<string | null> {
  const verifier = await SecureStore.getItemAsync(OAUTH_VERIFIER_KEY);
  if (verifier) {
    await SecureStore.deleteItemAsync(OAUTH_VERIFIER_KEY);
  }
  return verifier;
}

/**
 * Store OAuth nonce for replay protection
 */
export async function storeNonce(nonce: string): Promise<void> {
  await SecureStore.setItemAsync(OAUTH_NONCE_KEY, nonce);
}

/**
 * Get and remove OAuth nonce
 */
export async function getAndClearNonce(): Promise<string | null> {
  const nonce = await SecureStore.getItemAsync(OAUTH_NONCE_KEY);
  if (nonce) {
    await SecureStore.deleteItemAsync(OAUTH_NONCE_KEY);
  }
  return nonce;
}

/**
 * Clean up all OAuth-related temporary storage
 */
export async function cleanupOAuthStorage(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(OAUTH_STATE_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(OAUTH_VERIFIER_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(OAUTH_NONCE_KEY).catch(() => {}),
    ]);
  } catch (error) {
    console.error('Failed to cleanup OAuth storage:', error);
  }
}
