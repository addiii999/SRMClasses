import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.MODE === 'development' 
    ? '/api' 
    : (import.meta.env.VITE_API_URL || 'https://srmclasses-api.onrender.com/api'),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const getStoredToken = (key) => sessionStorage.getItem(key) || localStorage.getItem(key);

// Prefer httpOnly cookies; keep header token fallback for backward compatibility.
api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const authScope = config.headers['X-Auth-Scope'];
    const isAdminRoute = authScope === 'admin' || String(config.url || '').includes('/admin');
    const token = isAdminRoute
      ? getStoredToken('adminToken')
      : getStoredToken('studentToken');

    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  delete config.headers['X-Auth-Scope'];
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
        sessionStorage.removeItem('adminToken');
        localStorage.removeItem('adminToken');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        sessionStorage.removeItem('studentToken');
        localStorage.removeItem('studentToken');
        sessionStorage.removeItem('srmUser');
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
