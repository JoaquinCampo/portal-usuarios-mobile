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

const toAccessRequestDTO = (value: unknown): AccessRequestDTO | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  const getString = (keys: string[]): string | undefined => {
    for (const key of keys) {
      const v = candidate[key];
      if (v == null) continue;
      if (typeof v === 'string') return v;
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    }
    return undefined;
  };

  const getDateString = (keys: string[]): string | undefined => {
    for (const key of keys) {
      const v = candidate[key];
      if (v == null) continue;
      if (typeof v === 'string') return v;
      if (typeof v === 'number') {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
    }
    return undefined;
  };

  const dto: Partial<AccessRequestDTO> = {
    id: getString(['id']),
    healthUserId: getString(['healthUserId', 'userId', 'patientId']),
    healthWorkerId: getString(['healthWorkerId', 'workerId']),
    healthWorkerName: getString(['healthWorkerName', 'healthWorkerFullName', 'workerName']),
    clinicId: getString(['clinicId']),
    clinicName: getString(['clinicName']),
    specialtyId: getString(['specialtyId']),
    specialtyName: getString(['specialtyName']),
    createdAt: getDateString(['createdAt', 'created_at']),
    updatedAt: getDateString(['updatedAt', 'updated_at']),
  };

  const requiredKeys: (keyof AccessRequestDTO)[] = [
    'id',
    'healthUserId',
    'healthWorkerId',
    'healthWorkerName',
    'clinicId',
    'clinicName',
    'specialtyId',
    'specialtyName',
    'createdAt',
    'updatedAt',
  ];

  for (const key of requiredKeys) {
    if (!dto[key]) return null;
  }

  return dto as AccessRequestDTO;
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

  if (__DEV__) {
    console.log('[API] GET', url);
  }

  const response = await fetch(url, { headers });

  if (__DEV__) {
    console.log('[API] status', response.status);
  }

  if (!response.ok) {
    const errorPayload = await response.text().catch(() => '');
    throw new Error(
      `Failed to fetch access requests (${response.status}): ${errorPayload || response.statusText}`
    );
  }

  const data = (await response.json()) as unknown;

  if (__DEV__) {
    if (Array.isArray(data)) {
      console.log('[API] array length', data.length, 'keys', Object.keys((data[0] as any) || {}));
    } else if (data && typeof data === 'object') {
      console.log('[API] object keys', Object.keys(data as Record<string, unknown>));
    } else {
      console.log('[API] unexpected payload type', typeof data);
    }
  }

  if (Array.isArray(data)) {
    const typed = data
      .map(toAccessRequestDTO)
      .filter((v): v is AccessRequestDTO => v !== null);

    if (typed.length !== data.length) {
      console.warn('Filtered out invalid access request entries from response payload.');
    }

    return typed;
  }

  const single = toAccessRequestDTO(data);
  if (single) {
    console.warn('Received object instead of array. Coercing into single-item array.');
    return [single];
  }

  throw new Error('Unexpected API response while reading access requests.');
};

export const fetchHealthUserAccessRequestsByName = async (
  healthUserName: string
): Promise<AccessRequestDTO[]> => {
  if (__DEV__) {
    console.log('[API] fetching by name', healthUserName);
  }
  if (!healthUserName) {
    throw new Error('healthUserName is required');
  }

  const url = buildUrl(
    `access-requests/health-user/name/${encodeURIComponent(healthUserName)}`
  );
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const auth = getAuthHeader();

  if (auth) {
    headers.Authorization = auth;
  }

  if (__DEV__) {
    console.log('[API] GET', url);
  }

  const response = await fetch(url, { headers });

  if (__DEV__) {
    console.log('[API] status', response.status);
  }

  if (!response.ok) {
    const errorPayload = await response.text().catch(() => '');
    throw new Error(
      `Failed to fetch access requests (${response.status}): ${
        errorPayload || response.statusText
      }`
    );
  }

  const data = (await response.json()) as unknown;

  if (__DEV__) {
    if (Array.isArray(data)) {
      console.log('[API] array length', data.length, 'keys', Object.keys((data[0] as any) || {}));
    } else if (data && typeof data === 'object') {
      console.log('[API] object keys', Object.keys(data as Record<string, unknown>));
    } else {
      console.log('[API] unexpected payload type', typeof data);
    }
  }

  if (Array.isArray(data)) {
    const typed = data
      .map(toAccessRequestDTO)
      .filter((v): v is AccessRequestDTO => v !== null);

    if (typed.length !== data.length) {
      console.warn('Filtered out invalid access request entries from response payload.');
    }

    return typed;
  }

  const singleByName = toAccessRequestDTO(data);
  if (singleByName) {
    console.warn('Received object instead of array. Coercing into single-item array.');
    return [singleByName];
  }

  throw new Error('Unexpected API response while reading access requests.');
};
