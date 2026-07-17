<script setup lang="ts">
import { Layers } from 'lucide-vue-next';
import VideoCard from './VideoCard.vue';
import type { Job } from '@/feature/jobs/types';
import { computed } from 'vue';

const props = defineProps<{
  jobs: Job[];
  isCollapsed: boolean;
  activeTab?: string;
}>();

const getActualType = (job: Job): string => {
  if (job.videoUrl) {
    const cleanUrl = job.videoUrl.split('?')[0].split('#')[0];
    const ext = cleanUrl.split('.').pop()?.toLowerCase();
    if (ext && ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      return 'video';
    }
    if (ext && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
      return 'image';
    }
  }
  return job.type || 'video';
};

const displayItems = computed(() => {
  const result: (Job & { isPlaceholder?: boolean })[] = [];
  const groups = new Map<number, Job[]>();
  
  const orderedIds: number[] = [];
  
  const filteredJobs = (!props.activeTab || props.activeTab === 'all') 
    ? props.jobs 
    : props.jobs.filter(j => getActualType(j) === props.activeTab);
  
  for (const job of filteredJobs) {
    if (!groups.has(job.id)) {
      groups.set(job.id, []);
      orderedIds.push(job.id);
    }
    groups.get(job.id)!.push(job);
  }

  for (const id of orderedIds) {
    const group = groups.get(id)!;
    const firstJob = group[0];
    const isProcessing = ['WAITING', 'RUNNING', 'GENERATING', 'RENDERING'].includes(firstJob.status);
    
    for (const job of group) {
       if (job.videoUrl) {
           result.push(job);
       }
    }

    if (isProcessing) {
        let expectedQuantity = 1;
        if (firstJob.quantity) {
          const match = firstJob.quantity.match(/\d+/);
          if (match) expectedQuantity = parseInt(match[0], 10);
        }

        const currentVideosCount = group.filter(j => j.videoUrl).length;
        const missingPlaceholders = Math.max(0, expectedQuantity - currentVideosCount);

        for (let i = 0; i < missingPlaceholders; i++) {
            result.push({
                ...firstJob,
                id: Number(`${firstJob.id}99${i}`),
                videoUrl: undefined,
                isPlaceholder: true,
            } as Job);
        }
    } else {
        if (group.filter(j => j.videoUrl).length === 0) {
            result.push(firstJob);
        }
    }
  }

  return result;
});
</script>

<template>
  <div v-if="jobs.length === 0" class="h-full flex flex-col items-center justify-center text-gray-500">
    <Layers class="w-16 h-16 opacity-20 mb-4" />
    <p class="text-lg">Chưa có nội dung nào.</p>
    <p class="text-sm">Hãy thử nhập prompt ở bên dưới để tạo video đầu tiên!</p>
  </div>
  
  <div v-else class="flex flex-wrap gap-3.5 pb-32">
    <VideoCard v-for="(item, index) in displayItems" :key="`${item.id}-${item.videoUrl || index}`" :job="item" />
    <div style="flex-grow: 10"></div>
  </div>
</template>
