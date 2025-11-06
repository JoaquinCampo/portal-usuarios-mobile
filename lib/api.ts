import type { AccessRequestDTO } from '@/types/AccessRequestDTO';
import type { AddClinicAccessPolicyDTO } from '@/types/AddClinicAccessPolicyDTO';
import type { AddHealthWorkerAccessPolicyDTO } from '@/types/AddHealthWorkerAccessPolicyDTO';

type GlobalWithHelpers = typeof globalThis & {
  btoa?: (data: string) => string;
  Buffer?: {
    from: (data: string, encoding?: string) => { toString: (encoding: string) => string };
  };
};

const globalWithHelpers = globalThis as GlobalWithHelpers;

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim() ?? process.env.BACKEND_URL?.trim() ?? '';

const BACKEND_USERNAME =
  process.env.EXPO_PUBLIC_BACKEND_USERNAME?.trim() ?? process.env.BACKEND_USERNAME?.trim();

const BACKEND_PASSWORD =
  process.env.EXPO_PUBLIC_BACKEND_PASSWORD?.trim() ?? process.env.BACKEND_PASSWORD?.trim();

export class ApiConfigurationError extends Error {}

export const getBackendUrl = () => {
  if (!BACKEND_URL) {
    throw new ApiConfigurationError(
      'Missing BACKEND_URL. Ensure it is defined in your environment configuration.'
    );
  }

  return BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
};

const encodeCredentials = (username: string, password: string): string | undefined => {
  const payload = `${username}:${password}`;

  if (typeof globalWithHelpers.btoa === 'function') {
    return globalWithHelpers.btoa(payload);
  }

  const buffer = globalWithHelpers.Buffer;

  if (buffer) {
    return buffer.from(payload, 'utf8').toString('base64');
  }

  return undefined;
};

const getAuthHeader = () => {
  if (!BACKEND_USERNAME || !BACKEND_PASSWORD) {
    return undefined;
  }

  const encoded = encodeCredentials(BACKEND_USERNAME, BACKEND_PASSWORD);

  if (!encoded) {
    console.warn('Unable to encode backend credentials for basic auth.');
    return undefined;
  }

  return `Basic ${encoded}`;
};

const buildUrl = (path: string) => {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const isAccessRequestDTO = (value: unknown): value is AccessRequestDTO => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AccessRequestDTO>;

  return !!(
    candidate.id &&
    candidate.healthWorker &&
    candidate.clinic
  );
};

export const fetchHealthUserAccessRequests = async (
  healthUserId: string
): Promise<AccessRequestDTO[]> => {
  if (!healthUserId) {
    throw new Error('healthUserId is required');
  }

  const url = buildUrl(`access-requests?healthUserCi=${encodeURIComponent(healthUserId)}`);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const auth = getAuthHeader();

  if (auth) {
    headers.Authorization = auth;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[API] GET', url);
  }

  const response = await fetch(url, { headers });

  if (process.env.NODE_ENV === 'development') {
    console.log('[API] status', response.status);
  }

  if (!response.ok) {
    const errorPayload = await response.text().catch(() => '');
    throw new Error(
      `Failed to fetch access requests (${response.status}): ${errorPayload || response.statusText}`
    );
  }

  const data = (await response.json()) as unknown;

  if (process.env.NODE_ENV === 'development') {
    if (Array.isArray(data)) {
      console.log('[API] array length', data.length, 'keys', Object.keys((data[0] as any) || {}));
    } else if (data && typeof data === 'object') {
      console.log('[API] object keys', Object.keys(data as Record<string, unknown>));
    } else {
      console.log('[API] unexpected payload type', typeof data);
    }
  }

  if (Array.isArray(data)) {
    const typed = data.filter(isAccessRequestDTO);

    if (typed.length !== data.length) {
      console.warn('Filtered out invalid access request entries from response payload.');
    }

    return typed;
  }

  if (isAccessRequestDTO(data)) {
    console.warn('Received object instead of array. Coercing into single-item array.');
    return [data];
  }

  throw new Error('Unexpected API response while reading access requests.');
};


const assertNonEmpty = (value: string, label: string) => {
  if (!value) {
    throw new Error(`${label} is required`);
  }
};

export const registerNotificationToken = async (userCi: string, token: string) => {
  assertNonEmpty(userCi, 'userCi');
  assertNonEmpty(token, 'token');

  const url = buildUrl('/notification-tokens');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const auth = getAuthHeader();

  if (auth) {
    headers.Authorization = auth;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userCi, token }),
  });

  console.log('response', response);

  if (!response.ok) {
    const errorPayload = await response.text().catch(() => '');
    throw new Error(
      `Failed to register notification token (${response.status}): ${
        errorPayload || response.statusText
      }`
    );
  }
};

export const deleteNotificationToken = async (userCi: string, token: string) => {
  assertNonEmpty(userCi, 'userCi');
  assertNonEmpty(token, 'token');

  const url = buildUrl(
    `/notification-tokens/${encodeURIComponent(userCi)}/${encodeURIComponent(token)}`
  );

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const auth = getAuthHeader();

  if (auth) {
    headers.Authorization = auth;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok && response.status !== 404) {
    const errorPayload = await response.text().catch(() => '');
    throw new Error(
      `Failed to delete notification token (${response.status}): ${
        errorPayload || response.statusText
      }`
    );
  }
};

/**
 * Grant clinic access policy based on an access request
 */
export const grantClinicAccessPolicy = async (
  accessRequest: AccessRequestDTO
): Promise<Response> => {
  assertNonEmpty(accessRequest.id, 'accessRequestId');
  assertNonEmpty(accessRequest.healthUserId, 'healthUserId');
  assertNonEmpty(accessRequest.clinic.name, 'clinicName');

  const url = buildUrl('/access-policies/clinic');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const auth = getAuthHeader();

  if (auth) {
    headers.Authorization = auth;
  }

  const payload: AddClinicAccessPolicyDTO = {
    healthUserId: accessRequest.healthUserId,
    clinicName: accessRequest.clinic.name,
    accessRequestId: accessRequest.id,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  return response;
};

/**
 * Grant health worker access policy based on an access request
 */
export const grantHealthWorkerAccessPolicy = async (
  accessRequest: AccessRequestDTO
): Promise<Response> => {
  assertNonEmpty(accessRequest.id, 'accessRequestId');
  assertNonEmpty(accessRequest.healthUserId, 'healthUserId');
  assertNonEmpty(accessRequest.healthWorker.ci, 'healthWorkerCi');
  assertNonEmpty(accessRequest.clinic.name, 'clinicName');

  const url = buildUrl('/access-policies/health-worker');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const auth = getAuthHeader();

  if (auth) {
    headers.Authorization = auth;
  }

  const payload: AddHealthWorkerAccessPolicyDTO = {
    healthUserId: accessRequest.healthUserId,
    healthWorkerCi: accessRequest.healthWorker.ci,
    clinicName: accessRequest.clinic.name,
    accessRequestId: accessRequest.id,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  return response;
};

/**
 * Deny an access request by deleting it
 */
export const denyAccessRequest = async (
  accessRequestId: string
): Promise<Response> => {
  assertNonEmpty(accessRequestId, 'accessRequestId');

  const url = buildUrl(`/access-requests/${accessRequestId}`);
  const headers: Record<string, string> = {};

  const auth = getAuthHeader();

  if (auth) {
    headers.Authorization = auth;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  return response;
};
