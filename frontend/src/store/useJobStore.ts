import { create } from 'zustand';

export interface Job {
  id: number;
  status: string;
  prompt: string;
  model: string;
  duration: string;
  aspectRatio: string;
  createdAt: string;
  videoUrl?: string;
}

interface JobState {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJobStatus: (jobId: number, status: string, videoUrl?: string) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateJobStatus: (jobId, status, videoUrl) => set((state) => ({
    jobs: state.jobs.map(job => 
      job.id === jobId ? { ...job, status, ...(videoUrl && { videoUrl }) } : job
    )
  })),
}));
