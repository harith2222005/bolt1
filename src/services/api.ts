import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('guardshare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('guardshare_token');
      localStorage.removeItem('guardshare_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (data: { username?: string; email?: string }) =>
    api.put('/auth/profile', data),
};

export const filesAPI = {
  upload: (formData: FormData) =>
    api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getFiles: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    favorite?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/files', { params }),
  
  getRecent: () => api.get('/files/recent'),
  
  download: (fileId: string) =>
    api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    }),
  
  toggleFavorite: (fileId: string) =>
    api.patch(`/files/${fileId}/favorite`),
  
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),
  
  getAllFiles: (params?: any) => api.get('/files/admin/all', { params }),
};

export const linksAPI = {
  create: (linkData: any) => api.post('/links', linkData),
  
  getLinks: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/links', { params }),
  
  getRecent: () => api.get('/links/recent'),
  
  access: (linkId: string, params?: { password?: string; username?: string }) =>
    api.get(`/links/access/${linkId}`, { params }),
  
  download: (linkId: string, params?: { password?: string; username?: string }) =>
    api.get(`/links/download/${linkId}`, {
      params,
      responseType: 'blob',
    }),
  
  toggle: (linkId: string) => api.patch(`/links/${linkId}/toggle`),
  
  deleteLink: (linkId: string) => api.delete(`/links/${linkId}`),
  
  getAllLinks: (params?: any) => api.get('/links/admin/all', { params }),
};

export const usersAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/users', { params }),
  
  getUser: (userId: string) => api.get(`/users/${userId}`),
  
  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
  
  updateRole: (userId: string, role: string) =>
    api.patch(`/users/${userId}/role`, { role }),
  
  getActivityLogs: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/${userId}/activity`, { params }),
  
  searchUsers: (q: string) => api.get('/users/search/for-links', { params: { q } }),
};

export default api;