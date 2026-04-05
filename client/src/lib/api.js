import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.MODE === 'development' ? '/api' : 'https://srmclasses-api.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const token = isAdminRoute
      ? (localStorage.getItem('srmAdminToken') || localStorage.getItem('srmToken'))
      : (localStorage.getItem('srmToken') || localStorage.getItem('srmAdminToken'));

    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Handle 401 globally - clear token and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      if (isAdminRoute) {
        localStorage.removeItem('srmAdminToken');
      } else {
        localStorage.removeItem('srmToken');
        localStorage.removeItem('srmUser');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
