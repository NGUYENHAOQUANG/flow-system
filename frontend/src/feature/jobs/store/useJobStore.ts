import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Job } from '@/feature/jobs/types';

export const useJobStore = defineStore('job', () => {
  const jobs = ref<Job[]>([]);

  function setJobs(newJobs: Job[]) {
    jobs.value = newJobs;
  }

  function addJob(job: Job) {
    if (!jobs.value.some(j => j.id === job.id)) {
      jobs.value = [job, ...jobs.value];
    }
  }

  function updateJobStatus(jobId: number, status: string, videoUrl?: string) {
    // Update status for all jobs with this ID
    jobs.value.filter(j => j.id === jobId).forEach(job => {
      job.status = status;
    });
    
    // If a videoUrl is provided directly with status update (legacy flow)
    if (videoUrl) {
      handleFileUploaded(jobId, videoUrl);
    }
  }

  function handleFileUploaded(jobId: number, videoUrl: string) {
    const job = jobs.value.find(j => j.id === jobId && !j.videoUrl);
    if (job) {
       job.videoUrl = videoUrl;
    } else {
       const existing = jobs.value.find(j => j.id === jobId);
       if (existing) {
          jobs.value = [{ ...existing, videoUrl }, ...jobs.value];
       }
    }
  }

  // Quản lý các hình ảnh do người dùng tải lên từ thiết bị (để duy trì state khi đóng modal)
  const uploadedAssets = ref<any[]>([]);

  function addUploadedAsset(asset: any) {
    uploadedAssets.value.unshift(asset);
  }

  return { jobs, setJobs, addJob, updateJobStatus, handleFileUploaded, uploadedAssets, addUploadedAsset };
});
