import Constants from 'expo-constants';

const env = Constants.expoConfig?.extra ?? {};

const API_BASE_URL = env.API_URL || process.env.API_URL || 'https://sturdy-cod-wr9p9jvv7q76f5p5';
const AUTH_PORT = env.AUTH_PORT || process.env.AUTH_PORT || '-3000.app.github.dev';
const MENU_PORT = env.MENU_PORT || process.env.MENU_PORT || '-3200.app.github.dev';
const STOCK_PORT = env.STOCK_PORT || process.env.STOCK_PORT || '-3100.app.github.dev';
const ORDER_PORT = env.ORDER_PORT || process.env.ORDER_PORT || '-3300.app.github.dev';

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}${AUTH_PORT}`,
  menu: `${API_BASE_URL}${MENU_PORT}`,
  stock: `${API_BASE_URL}${STOCK_PORT}`,
  order: `${API_BASE_URL}${ORDER_PORT}`,
};

export const getApiUrl = (service: keyof typeof API_ENDPOINTS): string => {
  return API_ENDPOINTS[service];
};