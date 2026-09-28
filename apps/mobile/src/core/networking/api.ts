import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getInMemoryAccessToken } from './session';

// Set EXPO_PUBLIC_API_URL to the computer's LAN URL when using a physical device.
const getBaseUrl = () => process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') ||
  (Platform.OS === 'android' ? 'http://localhost:3000' : 'http://localhost:3000');

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
