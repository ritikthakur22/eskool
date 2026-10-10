import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getInMemoryAccessToken, getInMemoryRefreshToken, setInMemoryAccessToken, setInMemoryRefreshToken } from './session';

// Set EXPO_PUBLIC_API_URL to the computer's LAN URL when using a physical device.
const getBaseUrl = () => process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') ||
  (Platform.OS === 'android' ? 'https://eskool-sd7s.onrender.com' : 'https://eskool-sd7s.onrender.com');

export const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = getInMemoryAccessToken() || await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let refreshInFlight: Promise<string | null> | null = null;

api.interceptors.response.use(undefined, async (error) => {
  const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
  if (error.response?.status !== 401 || !original || original._retry || String(original.url || '').includes('/auth/')) return Promise.reject(error);
  original._retry = true;
  const refreshToken = getInMemoryRefreshToken() || await SecureStore.getItemAsync('refresh_token');
  if (!refreshToken) return Promise.reject(error);
  refreshInFlight ??= axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken }, { timeout: 10_000 })
    .then(async response => {
      const data = response.data;
      setInMemoryAccessToken(data.access_token);
      setInMemoryRefreshToken(data.refresh_token);
      await Promise.all([SecureStore.setItemAsync('access_token', data.access_token), SecureStore.setItemAsync('refresh_token', data.refresh_token), SecureStore.setItemAsync('user_data', JSON.stringify(data.user))]);
      return data.access_token as string;
    })
    .catch(async () => {
      await Promise.all([SecureStore.deleteItemAsync('access_token'), SecureStore.deleteItemAsync('refresh_token')]);
      setInMemoryAccessToken(null); setInMemoryRefreshToken(null);
      return null;
    })
    .finally(() => { refreshInFlight = null; });
  const accessToken = await refreshInFlight;
  if (!accessToken) return Promise.reject(error);
  original.headers = original.headers || {};
  original.headers.Authorization = `Bearer ${accessToken}`;
  return api(original);
});

export const uploadFile = async (uri: string, mimeType?: string, endpoint = '/upload') => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: uri.split('/').pop() || 'upload',
    type: mimeType || 'application/octet-stream',
  } as any);

  const response = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
