import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const fetchJobs = async () => {
  const res = await axios.get(`${API_URL}/jobs`);
  return res.data.data;
};

export const createJob = async (prompt: string, model: string = 'flow-ultra', duration: string = '5s', aspectRatio: string = '16:9') => {
  const res = await axios.post(`${API_URL}/jobs`, {
    prompt,
    model,
    duration,
    aspectRatio
  });
  return res.data.data;
};
