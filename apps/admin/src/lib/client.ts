// src/lib/api/client.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

export const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000"
// Business API calls (go through the Next proxy, which adds the Bearer token)
export const api = axios.create({ baseURL: `${APP_ORIGIN}/api/proxy`, withCredentials: true, timeout: 15_000 });
// Auth endpoints
export const authApi = axios.create({ baseURL: `${APP_ORIGIN}/api/auth`, withCredentials: true, timeout: 15_000 });

let refreshPromise: Promise<void> | null = null;

// Refresh tokens are single-use, so parallel 401s must share ONE refresh call.
function refreshSession() {
  refreshPromise ??= authApi
    .post('/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

const NO_REFRESH = ['/login', '/refresh', '/logout'];

function attachRefreshInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

      if (
        error.response?.status !== 401 ||
        !original ||
        original._retry ||
        NO_REFRESH.some((p) => original.url === p)
      ) {
        return Promise.reject(error);
      }

      original._retry = true;
      try {
        await refreshSession();
        return instance(original);
      } catch (refreshError) {
        if ((refreshError as AxiosError).response?.status === 401) {
          useAuthStore.getState().clear(); // AuthProvider/RequireAuth redirects to /login
        }
        return Promise.reject(error);
      }
    },
  );
}

attachRefreshInterceptor(api);
attachRefreshInterceptor(authApi);

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? fallback;
  return fallback;
}