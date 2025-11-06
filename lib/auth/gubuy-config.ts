import Constants from 'expo-constants';

export interface GubuyConfig {
  clientId: string;
  redirectUri: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  jwksUrl: string;
  logoutUrl: string;
  postLogoutRedirectUri: string;
  issuer: string;
  scope: string;
}

function requireEnv(name: string): string {
  const value = Constants.expoConfig?.extra?.[name] || process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function getEnv(name: string, defaultValue?: string): string | undefined {
  return Constants.expoConfig?.extra?.[name] || process.env[name] || defaultValue;
}

export function getGubuyConfig(): GubuyConfig {
  return {
    clientId: requireEnv('EXPO_PUBLIC_OIDC_CLIENT_ID'),
    redirectUri: requireEnv('EXPO_PUBLIC_OIDC_REDIRECT_URI'),
    authorizeUrl: requireEnv('EXPO_PUBLIC_OIDC_AUTHORIZE_URL'),
    tokenUrl: requireEnv('EXPO_PUBLIC_OIDC_TOKEN_URL'),
    userinfoUrl: requireEnv('EXPO_PUBLIC_OIDC_USERINFO_URL'),
    jwksUrl: requireEnv('EXPO_PUBLIC_OIDC_JWKS_URL'),
    logoutUrl: requireEnv('EXPO_PUBLIC_OIDC_LOGOUT_URL'),
    postLogoutRedirectUri: getEnv(
      'EXPO_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI',
      'http://localhost:8080/logout'
    )!,
    issuer: requireEnv('EXPO_PUBLIC_OIDC_ISSUER'),
    scope: getEnv(
      'EXPO_PUBLIC_OIDC_SCOPE',
      'openid document personal_info profile auth_info email'
    )!,
  };
}

export const GUBUY_CONFIG = getGubuyConfig();

// Cookie/Storage keys
export const OAUTH_STATE_KEY = 'gubuy_oauth_state';
export const OAUTH_VERIFIER_KEY = 'gubuy_oauth_code_verifier';
export const OAUTH_NONCE_KEY = 'gubuy_oauth_nonce';
export const SESSION_KEY = 'portal_session';
