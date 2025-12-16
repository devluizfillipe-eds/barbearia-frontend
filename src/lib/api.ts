import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token em requisições autenticadas (será implementado depois com auth context)
api.interceptors.request.use((config) => {
  // TODO: Adicionar token do cookie/localStorage
  return config;
});
