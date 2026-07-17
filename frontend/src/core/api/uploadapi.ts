import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoint';

export const uploadVideoApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post(API_ENDPOINTS.UPLOAD.VIDEO, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res.data.data.url;
};

export const uploadImageApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post(API_ENDPOINTS.UPLOAD.IMAGE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res.data.data.url;
};
