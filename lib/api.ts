import type { AccessRequestDTO } from '@/types/AccessRequestDTO';

type GlobalWithHelpers = typeof globalThis & {
  btoa?: (data: string) => string;
  Buffer?: {
    from: (data: string, encoding?: string) => { toString: (encoding: string) => string };
  };
};

const globalWithHelpers = globalThis as GlobalWithHelpers;

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim() ?? process.env.BACKEND_URL?.trim() ?? '';
console.log(BACKEND_URL);

const BACKEND_USERNAME =
  process.env.EXPO_PUBLIC_BACKEND_USERNAME?.trim() ?? process.env.BACKEND_USERNAME?.trim();

console.log(BACKEND_USERNAME);
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

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.healthUserId === 'string' &&
    typeof candidate.healthWorkerId === 'string' &&
    typeof candidate.healthWorkerName === 'string' &&
    typeof candidate.clinicId === 'string' &&
    typeof candidate.clinicName === 'string' &&
    typeof candidate.specialtyId === 'string' &&
    typeof candidate.specialtyName === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
};

export const fetchHealthUserAccessRequests = async (
  healthUserId: string
): Promise<AccessRequestDTO[]> => {
  if (!healthUserId) {
    throw new Error('healthUserId is required');
  }

  const url = buildUrl(`access-requests/health-user/${encodeURIComponent(healthUserId)}`);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const auth = getAuthHeader();

  if (auth) {
    headers.Authorization = auth;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorPayload = await response.text().catch(() => '');
    throw new Error(
      `Failed to fetch access requests (${response.status}): ${errorPayload || response.statusText}`
    );
  }

  const data = (await response.json()) as unknown;

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
