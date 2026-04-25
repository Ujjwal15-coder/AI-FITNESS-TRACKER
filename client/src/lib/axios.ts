import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:1337/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle common errors (like unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., clear token and redirect to login)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
