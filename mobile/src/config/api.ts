import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, getAssetBaseUrl } from './env';

const TOKEN_KEY = 'user-token';

const API_BASE_URL = getApiBaseUrl();

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const asset = getAssetBaseUrl();
  console.log('[SemBuzz API] base URL:', API_BASE_URL, asset !== API_BASE_URL ? `(uploads/images: ${asset})` : '');
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export { getApiBaseUrl };
