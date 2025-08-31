// Tag APIs
export const fetchTags = (params) => api.get('/api/tags/', { params });
export const fetchTag = (id) => api.get(`/api/tags/${id}/`);
export const createTag = (data) => api.post('/api/tags/', data);
export const updateTag = (id, data) => api.put(`/api/tags/${id}/`, data);
export const deleteTag = (id) => api.delete(`/api/tags/${id}/`);

// CourseProgress APIs
export const fetchCourseProgresses = (params) => api.get('/api/course-progress/', { params });
export const fetchCourseProgress = (id) => api.get(`/api/course-progress/${id}/`);
export const createCourseProgress = (data) => api.post('/api/course-progress/', data);
export const updateCourseProgress = (id, data) => api.put(`/api/course-progress/${id}/`, data);
export const deleteCourseProgress = (id) => api.delete(`/api/course-progress/${id}/`);

// Document APIs
export const fetchDocuments = (params) => api.get('/api/documents/', { params });
export const fetchDocument = (id) => api.get(`/api/documents/${id}/`);
export const createDocument = (data) => api.post('/api/documents/', data);
export const updateDocument = (id, data) => api.put(`/api/documents/${id}/`, data);
export const deleteDocument = (id) => api.delete(`/api/documents/${id}/`);

// Question APIs
export const fetchQuestions = (params) => api.get('/api/questions/', { params });
export const fetchQuestion = (id) => api.get(`/api/questions/${id}/`);
export const createQuestion = (data) => api.post('/api/questions/', data);
export const updateQuestion = (id, data) => api.put(`/api/questions/${id}/`, data);
export const deleteQuestion = (id) => api.delete(`/api/questions/${id}/`);

// Answer APIs
export const fetchAnswers = (params) => api.get('/api/answers/', { params });
export const fetchAnswer = (id) => api.get(`/api/answers/${id}/`);
export const createAnswer = (data) => api.post('/api/answers/', data);
export const updateAnswer = (id, data) => api.put(`/api/answers/${id}/`, data);
export const deleteAnswer = (id) => api.delete(`/api/answers/${id}/`);

// Review APIs
export const fetchReviews = (params) => api.get('/api/reviews/', { params });
export const fetchReview = (id) => api.get(`/api/reviews/${id}/`);
export const createReview = (data) => api.post('/api/reviews/', data);
export const updateReview = (id, data) => api.put(`/api/reviews/${id}/`, data);
export const deleteReview = (id) => api.delete(`/api/reviews/${id}/`);

// Notification APIs
export const fetchNotifications = (params) => api.get('/api/notifications/', { params });
export const fetchNotification = (id) => api.get(`/api/notifications/${id}/`);
export const createNotification = (data) => api.post('/api/notifications/', data);
export const updateNotification = (id, data) => api.put(`/api/notifications/${id}/`, data);
export const deleteNotification = (id) => api.delete(`/api/notifications/${id}/`);

// UserNotification APIs
export const fetchUserNotifications = (params) => api.get('/api/user-notifications/', { params });
export const fetchUserNotification = (id) => api.get(`/api/user-notifications/${id}/`);
export const createUserNotification = (data) => api.post('/api/user-notifications/', data);
export const updateUserNotification = (id, data) => api.put(`/api/user-notifications/${id}/`, data);
export const deleteUserNotification = (id) => api.delete(`/api/user-notifications/${id}/`);
import { GitHub } from '@mui/icons-material';
import axios from 'axios';

const BE_ROOT = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: BE_ROOT,
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
    userInfo: '/api/users/current_user/',
    updateProfile: '/api/users/current_user/',
  },
  social_auth: {
    'google-oauth2': `${BE_ROOT}/auth/login/google-oauth2/`,
    'facebook': `${BE_ROOT}/auth/login/facebook/`,
    'github': `${BE_ROOT}/auth/login/github/`,
  },
  user: {
    list: '/api/users/',
    create: '/api/users/',
    update: (id) => `/api/users/${id}/`,
    listInstructors: (params = '') => `/api/users/instructors/${params ? '?' + params : ''}`,
    listLearners: (params = '') => `/api/users/learners/${params ? '?' + params : ''}`,
    listCenters: (params = '') => `/api/users/centers/${params ? '?' + params : ''}`,
    activate: (id) => `/api/users/${id}/activate/`,
    deactivate: (id) => `/api/users/${id}/deactivate/`,
    userInfo: '/api/users/current_user/',
    updateProfile: '/api/users/current_user/',

  },
};

// Export axios instance và endpoints để dùng trực tiếp
export default api;


