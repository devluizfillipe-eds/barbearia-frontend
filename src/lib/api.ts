import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://bozosbarbeiros.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token em requisições autenticadas (será implementado depois com auth context)
api.interceptors.request.use((config) => {
  // TODO: Adicionar token do cookie/localStorage
  return config;
});
