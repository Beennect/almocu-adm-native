import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure sua URL base aqui (ex: http://192.168.1.10:3000)
export const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor para adicionar token e x-restaurant-id de forma assíncrona
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      const restaurantId = await AsyncStorage.getItem('selected_restaurant_id');
      if (restaurantId) {
        config.headers['x-restaurant-id'] = restaurantId;
      }
    } catch (e) {
      console.error('Error fetching token/restaurantId in API interceptor', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
