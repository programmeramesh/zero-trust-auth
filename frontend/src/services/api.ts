import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration and refresh automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          api.defaults.headers.Authorization = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  getCaptcha: () => api.get('/auth/captcha'),
  signup: (data: { name: string; email: string; password: string; captchaId?: string; captchaInput?: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string; captchaId?: string; captchaInput?: string }) =>
    api.post('/auth/login', data),
  verifyMFA: (data: { tempToken: string; otp: string }) =>
    api.post('/auth/verify-mfa', data),
  enableMFA: () => api.post('/auth/enable-mfa'),
  confirmMFA: (data: { otp: string }) => api.post('/auth/confirm-mfa', data),
  disableMFA: (data: { otp: string }) => api.post('/auth/disable-mfa', data),
  verifyEmail: (token: string) => api.post(`/auth/verify-email/${token}`),
  resendVerification: (data: { email: string }) =>
    api.post('/auth/resend-verification', data),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (token: string, data: { password: string }) =>
    api.post(`/auth/reset-password/${token}`, data),
  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post('/auth/update-password', data),
  getMe: () => api.get('/auth/me'),
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (token: string) => api.delete(`/auth/sessions/${token}`),
  revokeAllSessions: () => api.delete('/auth/sessions'),
  revokeOtherSessions: () => api.delete('/auth/sessions/others'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken }),
  revokeRefreshToken: (refreshToken: string) => api.post('/auth/revoke-refresh', { refreshToken }),
};

export const deviceAPI = {
  getDevices: () => api.get('/devices'),
  trustDevice: (deviceId: string) => api.post(`/devices/${deviceId}/trust`),
  untrustDevice: (deviceId: string) => api.post(`/devices/${deviceId}/untrust`),
  deleteDevice: (deviceId: string) => api.delete(`/devices/${deviceId}`),
};

export const activityLogAPI = {
  getMyLogs: (limit?: number) => api.get(`/activity-logs/my-logs?limit=${limit || 50}`),
  getAllLogs: (limit?: number, skip?: number) =>
    api.get(`/activity-logs/all?limit=${limit || 100}&skip=${skip || 0}`),
  getFailedLogs: (limit?: number) => api.get(`/activity-logs/failed?limit=${limit || 50}`),
  getLogsByAction: (action: string, limit?: number) =>
    api.get(`/activity-logs/action/${action}?limit=${limit || 50}`),
};

export const securityEventAPI = {
  getMyEvents: (limit?: number) => api.get(`/security-events/my-events?limit=${limit || 50}`),
  getAllEvents: (limit?: number, skip?: number) =>
    api.get(`/security-events/all?limit=${limit || 100}&skip=${skip || 0}`),
  getOpenEvents: (limit?: number) => api.get(`/security-events/open?limit=${limit || 50}`),
  getStatistics: () => api.get('/security-events/statistics'),
  resolveEvent: (eventId: string, status?: string) =>
    api.post(`/security-events/${eventId}/resolve`, { status }),
};

export const dashboardAPI = {
  getStatistics: () => api.get('/dashboard/statistics'),
  getMyDashboard: () => api.get('/dashboard/my-dashboard'),
};

export const filesAPI = {
  presignUpload: (data: { fileName: string; contentType?: string }) => api.post('/files/presign/upload', data),
  presignDownload: (id: string) => api.get(`/files/${id}/presign-download`),
  completeUpload: (data: { s3Key: string; fileName: string; fileSize?: number; salt?: string; iv?: string; textContent?: string }) =>
    api.post('/files/presign/complete', data),
  listFiles: () => api.get('/files'),
  getFile: (id: string) => api.get(`/files/${id}`),
};

export default api;
