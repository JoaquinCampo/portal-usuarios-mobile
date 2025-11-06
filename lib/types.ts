export interface PortalSession {
  healthUser: {
    id: string; // Document number
    name: string; // Full name
  };
  healthWorker: {
    id: string;
    name: string;
  };
  clinic: {
    id: string;
    name: string;
  };
  access: {
    source: string; // "GUBUY_OIDC"
    message: string;
  };
  issuedAt: string; // ISO timestamp
  tokens?: {
    idToken: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // Unix timestamp (milliseconds)
  };
  attributes?: {
    numero_documento?: string;
    email?: string;
    nid?: string; // Identity level
    issuer?: string;
    idp?: string; // Identity provider
  };
}

export interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  id_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

export interface OpenIdConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  end_session_endpoint?: string;
  jwks_uri: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  claims_supported?: string[];
}

export interface UserInfo {
  sub?: string;
  uid?: string;
  numero_documento?: string;
  nombre_completo?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  email?: string;
  nid?: string;
  idp?: string;
  [key: string]: unknown;
}
