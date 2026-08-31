import axios from 'axios';
import Cookies from 'js-cookie';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o token em todas as requisições automaticamente
api.interceptors.request.use((config) => {
  const token = Cookies.get('gallery_token');

  console.log("baseUrl", process.env.NEXT_PUBLIC_API_URL);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});