import axios, { type AxiosError } from 'axios';
import { tokenStorage } from './tokenStorage';

/** Fired when the backend rejects the current token, so the app can log the user out. */
export const UNAUTHORIZED_EVENT = 'afcm:unauthorized';

export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

if (USE_MOCK) {
  // The mock backend lives in src/mocks and is only loaded when VITE_USE_MOCK=true.
  api.defaults.adapter = async (config) => {
    const { mockAdapter } = await import('../mocks/mockAdapter');
    return mockAdapter(config);
  };
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? '';
    const isAuthCall = url.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall && tokenStorage.getToken()) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;
