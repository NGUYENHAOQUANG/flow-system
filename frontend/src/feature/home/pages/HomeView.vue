<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useJobStore } from '@/feature/jobs/store/useJobStore';
import { useSocket } from '@/core/services/socket.service';
import { fetchJobs, createJob } from '@/feature/jobs/api/jobs.api';

import MainLayout from '@/app/layout/components/MainLayout.vue';
import VideoGrid from '@/feature/jobs/components/VideoGrid.vue';
import FloatingPrompt from '@/feature/jobs/components/FloatingPrompt.vue';
import { storeToRefs } from 'pinia';

const jobStore = useJobStore();
const { jobs } = storeToRefs(jobStore);

// Gọi hook websocket (tự động connect lúc mounted và disconnect lúc unmounted)
useSocket();

const isSubmitting = ref(false);
const isSidebarCollapsed = ref(false);
const activeTab = ref('all');

onMounted(() => {
  fetchJobs().then(jobsData => {
    jobStore.setJobs(jobsData);
  }).catch(console.error);
});

const handleGenerate = async (prompt: string, model: string, duration: string, aspectRatio: string, quantity: string, tab: string, type: string, imageUrls: string[] = []) => {
  isSubmitting.value = true;
  try {
    await createJob(prompt, model, duration, aspectRatio, quantity, tab, type, imageUrls);
  } catch (err) {
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <MainLayout 
    :is-collapsed="isSidebarCollapsed" 
    :active-tab="activeTab"
    @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
    @select-tab="activeTab = $event"
  >
    <VideoGrid :jobs="jobs" :is-collapsed="isSidebarCollapsed" :active-tab="activeTab" />
    <FloatingPrompt 
      :is-submitting="isSubmitting"
      :active-tab="activeTab"
      @submit="handleGenerate" 
    />
  </MainLayout>
</template>
