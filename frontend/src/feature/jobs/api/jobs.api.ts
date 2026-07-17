import { apiClient } from '@/core/api/apiClient';
import { API_ENDPOINTS } from '@/core/api/endpoint';

export const fetchJobs = async () => {
  const res = await apiClient.get(API_ENDPOINTS.JOBS.BASE);
  return res.data.data;
};

export const createJob = async (
  prompt: string,
  model: string = 'Veo 3.1 - Lite',
  duration: string = '8s',
  aspectRatio: string = '16:9',
  quantity: string = '1x',
  tab: string = 'khung_hinh',
  type: string = 'video',
  imageUrls: string[] = []
) => {
  const res = await apiClient.post(API_ENDPOINTS.JOBS.BASE, {
    prompt,
    model,
    duration,
    aspectRatio,
    quantity,
    tab,
    type,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
  });
  return res.data.data;
};
