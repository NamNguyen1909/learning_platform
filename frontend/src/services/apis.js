import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api', //BE URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token vào header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

// Response interceptor để xử lý token hết hạn
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          console.log('Attempting to refresh token...');
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          
          console.log('Token refreshed successfully');
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Refresh failed, clear tokens but don't auto-redirect in API layer
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          delete api.defaults.headers.common['Authorization'];
          
          // Let the component handle the authentication error
          return Promise.reject(new Error('AUTHENTICATION_REQUIRED'));
        }
      } else {
        console.warn('No refresh token available');
        // No refresh token available
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete api.defaults.headers.common['Authorization'];
        return Promise.reject(new Error('AUTHENTICATION_REQUIRED'));
      }
    }
    
    return Promise.reject(error);
  }
);

// API Endpoints configuration
export const endpoints = {
    // Authentication endpoints
  auth: {
    login: '/auth/token/',
    refresh: '/auth/token/refresh/',
    register: '/auth/register/',
    logout: '/auth/token/blacklist/',
    userInfo: '/auth/user/',
  },
  user:{
    list: '/users/',
    create: '/users/',
    update: (id) => `/users/${id}/`,
  }

}

export default api;
