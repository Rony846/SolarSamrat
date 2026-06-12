import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

export const TOKEN_KEY = 'samrat_token';
export const USER_KEY = 'samrat_user';

const api = axios.create({ baseURL: API_URL, timeout: 25000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const hadToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (hadToken) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        unauthorizedHandler?.();
      }
    }
    return Promise.reject(error);
  },
);

export default api;

/** Human-readable message from an API/network error (FastAPI `{detail}` shape). */
export function apiError(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) return 'Network error. Check your connection.';
    const detail = (e.response.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
  }
  return fallback;
}
