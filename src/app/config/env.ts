const DEFAULT_API_URL = 'http://localhost:8080/api';

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_URL,
};
