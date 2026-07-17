import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000, // Timeout 30s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Thêm token vào header nếu có
    // const token = localStorage.getItem('token');
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Format chung của response có thể xử lý ở đây
    return response;
  },
  (error) => {
    // Xử lý lỗi toàn cục (ví dụ: 401 Unauthorized -> Logout)
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
