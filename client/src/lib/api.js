import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.MODE === 'development' 
    ? '/api' 
    : (import.meta.env.VITE_API_URL || 'https://srmclasses-api.onrender.com/api'),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT: admin area uses only admin token; everything else uses only student token from localStorage
api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const token = isAdminRoute
      ? localStorage.getItem('adminToken')
      : localStorage.getItem('studentToken');

    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Handle 401 globally - clear specific storage and redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Auto-retry once for network errors/timeouts (cold start mitigation)
    if (config && !config._retried && (!error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error'))) {
      config._retried = true;
      console.warn('Network issue detected (likely server cold start). Retrying in 3s...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return api(config);
    }
    if (error.response?.status === 401) {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      if (isAdminRoute) {
        localStorage.removeItem('adminToken');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('srmUser');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
