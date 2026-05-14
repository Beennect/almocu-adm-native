import axios from 'axios';
import { getApiUrl, API_ENDPOINTS } from './api-config';
import { authService } from './auth-service';

const createApiInstance = (service: keyof typeof API_ENDPOINTS) => {
  const instance = axios.create({
    baseURL: getApiUrl(service),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  instance.interceptors.request.use(
    async (config) => {
      try {
        const token = await authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('[API] Erro ao obter token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

export const authApi = createApiInstance('auth');
export const menuApi = createApiInstance('menu');
export const stockApi = createApiInstance('stock');
export const orderApi = createApiInstance('order');

const api = createApiInstance('auth');

export default api;
