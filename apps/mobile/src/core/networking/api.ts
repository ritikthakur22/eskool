import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use local network IP if testing on physical device, or localhost for simulator
const getBaseUrl = () => {
  // Replace this with your computer's local IP address (e.g. 192.168.1.17)
  const LOCAL_IP = '192.168.1.17'; 
  
  if (Platform.OS === 'android') {
    // Android emulator alias for localhost is 10.0.2.2, but for physical device on WiFi it's the LAN IP
    return `http://${LOCAL_IP}:3000`;
  }
  return `http://${LOCAL_IP}:3000`;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
