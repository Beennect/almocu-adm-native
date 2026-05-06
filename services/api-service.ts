import axios from 'axios';

// Configure sua URL base aqui (ex: http://192.168.1.10:3000)
const API_URL = 'http://localhost:3000'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor opcional (ex: para logs ou adicionar tokens)
api.interceptors.request.use(
  (config) => {
    // console.log('Request:', config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
