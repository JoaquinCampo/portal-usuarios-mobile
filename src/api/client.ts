import axios from 'axios';
import { encode as base64Encode } from 'base-64';
import { BACKEND_PASSWORD, BACKEND_URL, BACKEND_USERNAME } from '@env';

const trimmedBaseUrl = BACKEND_URL?.trim();
const trimmedUsername = BACKEND_USERNAME?.trim();
const trimmedPassword = BACKEND_PASSWORD?.trim();

if (!trimmedBaseUrl) {
  console.warn(
    '[api] BACKEND_URL env variable is missing or empty. API requests will fail until it is set.',
  );
}

if (!trimmedUsername || !trimmedPassword) {
  console.warn(
    '[api] BACKEND_USERNAME or BACKEND_PASSWORD env variables are missing. Basic auth will not be applied.',
  );
}

const basicAuthToken =
  trimmedUsername && trimmedPassword
    ? base64Encode(`${trimmedUsername}:${trimmedPassword}`)
    : undefined;

export const apiClient = axios.create({
  baseURL: trimmedBaseUrl || undefined,
  timeout: 10000,
  headers: basicAuthToken
    ? {
        Authorization: `Basic ${basicAuthToken}`,
      }
    : undefined,
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      console.error(
        '[api] Request rejected with 401 Unauthorized. Check BACKEND_USERNAME/BACKEND_PASSWORD values or server credentials.',
      );
    }
    console.error('[api] Request failed', error);
    return Promise.reject(error);
  },
);
