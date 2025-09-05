import { GitHub } from "@mui/icons-material";
import axios from "axios";

const BE_ROOT = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: BE_ROOT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor để thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý token hết hạn
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          console.log("Attempting to refresh token...");
          const response = await axios.post(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
            }/api/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          localStorage.setItem("access_token", access);
          api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

          console.log("Token refreshed successfully");

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // Refresh failed, clear tokens but don't auto-redirect in API layer
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          delete api.defaults.headers.common["Authorization"];

          // Let the component handle the authentication error
          return Promise.reject(new Error("AUTHENTICATION_REQUIRED"));
        }
      } else {
        console.warn("No refresh token available");
        // No refresh token available
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        delete api.defaults.headers.common["Authorization"];
        return Promise.reject(new Error("AUTHENTICATION_REQUIRED"));
      }
    }

    return Promise.reject(error);
  }
);

// API Endpoints configuration

export const endpoints = {
  // Authentication endpoints
  auth: {
    login: "/auth/token/",
    refresh: "/auth/token/refresh/",
    register: "/auth/register/",
    logout: "/auth/token/blacklist/",
    userInfo: "/api/users/current_user/",
    updateProfile: "/api/users/current_user/",
  },
  social_auth: {
    "google-oauth2": `${BE_ROOT}/auth/login/google-oauth2/`,
    facebook: `${BE_ROOT}/auth/login/facebook/`,
    github: `${BE_ROOT}/auth/login/github/`,
  },
  user: {
    list: "/api/users/",
    create: "/api/users/",
    update: (id) => `/api/users/${id}/`,
    listInstructors: (params = "") =>
      `/api/users/instructors/${params ? "?" + params : ""}`,
    listLearners: (params = "") =>
      `/api/users/learners/${params ? "?" + params : ""}`,
    listCenters: (params = "") =>
      `/api/users/centers/${params ? "?" + params : ""}`,
    activate: (id) => `/api/users/${id}/activate/`,
    deactivate: (id) => `/api/users/${id}/deactivate/`,
    userInfo: "/api/users/current_user/",
    updateProfile: "/api/users/current_user/",
  },
  course: {
    create: "/api/courses/",
    list: "/api/courses/",
    detail: (id) => `/api/courses/${id}/`,
    register: (id) => `/api/courses/${id}/register/`,
    deactivate: (id) => `/api/courses/${id}/deactivate/`,
    hot: "/api/courses/hot/",
    suggested: "/api/courses/suggested/",
    myCourses:"/api/courses/my-courses/",
  },
  payment: {
    list: "/api/payments/",
    create: "/api/payments/",
    detail: (id) => `/api/payments/${id}/`,
    createPaymentUrl: "/api/vnpay/create_payment_url/",
    vnpayRedirect: "/api/vnpay/redirect/",
  },
  statistics: {
    courses: "/api/statistics/courses/",
    instructors: "/api/statistics/instructors/",
    learners: "/api/statistics/learners/",
  },

  tag: {
    list: "/api/tags/",
    detail: (id) => `/api/tags/${id}/`,
  },
  
  courseProgress: {
    list: "/api/course-progress/",
    detail: (id) => `/api/course-progress/${id}/`,
    update: (id) => `/api/course-progress/${id}/`,
  },
  document: {
    list: (params = {}) => {
      const query = Object.keys(params)
        .map((k) => `${k}=${params[k]}`)
        .join("&");
      return `/api/documents/${query ? "?" + query : ""}`;
    },
    detail: (id) => `/api/documents/${id}/`,
    create: "/api/documents/",
    update: (id) => `/api/documents/${id}/`,
    delete: (id) => `/api/documents/${id}/`,
    upload: "/api/documents/upload/",
    download: (id) => `/api/documents/${id}/download/`,
  },
  documentCompletion: {
    list: "/api/document-completions/",
    detail: (id) => `/api/document-completions/${id}/`,
    create: "/api/document-completions/",
    update: (id) => `/api/document-completions/${id}/`,
    delete: (id) => `/api/document-completions/${id}/`,
  },
  question: {
    list: "/api/questions/",
    detail: (id) => `/api/questions/${id}/`,
    create: "/api/questions/",
    update: (id) => `/api/questions/${id}/`,
    delete: (id) => `/api/questions/${id}/`,
  },
  answer: {
    list: "/api/answers/",
    detail: (id) => `/api/answers/${id}/`,
    create: "/api/answers/",
    update: (id) => `/api/answers/${id}/`,
    delete: (id) => `/api/answers/${id}/`,
  },
  review: {
    list: "/api/reviews/",
    detail: (id) => `/api/reviews/${id}/`,
    create: "/api/reviews/",
    update: (id) => `/api/reviews/${id}/`,
    delete: (id) => `/api/reviews/${id}/`,
    listByCourse: (courseId, page = 1) =>
      `/api/reviews/by-course/${courseId}/?page=${page}`,
  },
  notification: {
    list: "/api/notifications/",
    detail: (id) => `/api/notifications/${id}/`,
    create: "/api/notifications/",
    update: (id) => `/api/notifications/${id}/`,
    delete: (id) => `/api/notifications/${id}/`,
  },
  userNotification: {
    list: "/api/user-notifications/",
    detail: (id) => `/api/user-notifications/${id}/`,
    create: "/api/user-notifications/",
    update: (id) => `/api/user-notifications/${id}/`,
    delete: (id) => `/api/user-notifications/${id}/`,
    markRead: (id) => `/api/user-notifications/${id}/mark_as_read/`,
    markAllRead: "/api/user-notifications/mark_all_as_read/",
    unread: "/api/user-notifications/unread/",
  },
};

// Export axios instance và endpoints để dùng trực tiếp



// Lấy 5 khoá học hot nhất tuần
export const getHotCourses = () => api.get(endpoints.course.hot);

// Lấy 5 khoá học gợi ý cho user hiện tại
export const getSuggestedCourses = () => api.get(endpoints.course.suggested);
// Thống kê cho admin/center
export const getCourseStatistics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`${endpoints.statistics.courses}${query ? '?' + query : ''}`);
};
export const getInstructorStatistics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`${endpoints.statistics.instructors}${query ? '?' + query : ''}`);
};
export const getLearnerStatistics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`${endpoints.statistics.learners}${query ? '?' + query : ''}`);
};

// Notification API functions
export const fetchNotifications = async (page = 1, limit = 10) => {
  const response = await api.get(`${endpoints.userNotification.list}?page=${page}&limit=${limit}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  return api.post(endpoints.userNotification.markRead(notificationId));
};

export const deleteUserNotification = async (userNotificationId) => {
  return api.delete(endpoints.userNotification.delete(userNotificationId));
};

export const markAllAsRead = async () => {
  return api.post(endpoints.userNotification.markAllRead);
};

export const getUnreadNotifications = async () => {
  const response = await api.get(endpoints.userNotification.unread);
  return response.data;
};

// Payment API functions
export const createCoursePayment = (data) => api.post(endpoints.payment.create, data);
export const createPaymentUrl = (params) => api.get(endpoints.payment.createPaymentUrl, { params });

// New API call for instructor's own courses
export const getMyCourses = (params = {}) => {
  return api.get(endpoints.course.myCourses, { params });
};

// Document upload API function
export const uploadDocument = (formData) => {
  return api.post(endpoints.document.upload, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;
