export const API_ENDPOINTS = {
  JOBS: {
    BASE: '/jobs',
    DETAIL: (id: string | number) => `/jobs/${id}`,
  },
  UPLOAD: {
    VIDEO: '/upload/video',
    IMAGE: '/upload/image',
  },
} as const;
