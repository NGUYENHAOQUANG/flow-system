<script setup lang="ts">
import { ref, computed } from 'vue';
import { Play, Loader2, Download, Clock } from 'lucide-vue-next';
import type { Job } from '@/feature/jobs/types';
import { useVideoManager } from '@/feature/jobs/composables/useVideoManager';

const props = defineProps<{
  job: Job;
}>();

const actualType = computed(() => {
  if (props.job.videoUrl) {
    const cleanUrl = props.job.videoUrl.split('?')[0].split('#')[0];
    const ext = cleanUrl.split('.').pop()?.toLowerCase();
    if (ext && ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      return 'video';
    }
    if (ext && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
      return 'image';
    }
  }
  return props.job.type || 'video';
});

const videoRef = ref<HTMLVideoElement | null>(null);
// containerRef dùng để IntersectionObserver biết khi nào card vào viewport
const containerRef = ref<HTMLElement | null>(null);
// Khởi tạo ngay từ job.aspectRatio để tránh layout jump khi video load
const detectedAspectRatio = ref<string | null>(props.job.aspectRatio || null);

const handleLoadedMetadata = (event: Event) => {
  // Chỉ detect từ metadata khi server chưa cung cấp aspectRatio
  if (props.job.aspectRatio) return;

  const video = event.target as HTMLVideoElement;
  if (video) {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width && height) {
      const ratio = width / height;
      if (ratio < 0.8) {
        detectedAspectRatio.value = '9:16';
      } else if (ratio > 1.2) {
        detectedAspectRatio.value = '16:9';
      } else if (ratio >= 0.8 && ratio <= 1.2) {
        detectedAspectRatio.value = '1:1';
      }
    }
  }
};

const aspectRatioValue = computed(() => {
  // detectedAspectRatio đã được init từ job.aspectRatio nên luôn có giá trị sớm
  const ratioStr = detectedAspectRatio.value;
  switch (ratioStr) {
    case '9:16': return 9 / 16;
    case '1:1': return 1;
    case '4:3': return 4 / 3;
    case '3:4': return 3 / 4;
    case '16:9':
    default: return 16 / 9;
  }
});

// --- Loading state: skeleton shimmer + fade-in ---
const isLoaded = ref(false);
const handleMediaLoaded = () => { isLoaded.value = true; };

// --- Error state ---
const imgError = ref(false);
const videoError = ref(false);
const handleImgError = () => { imgError.value = true; };
const handleVideoError = () => { videoError.value = true; };

// --- Hover play/pause + lazy src loading (qua composable useVideoManager) ---
const { lazySrc, handleMouseEnter, handleMouseLeave } = useVideoManager(
  videoRef,
  containerRef,
  props.job.videoUrl || ''
);

const handleDragStart = (e: DragEvent) => {
  // Chỉ cho phép kéo hình ảnh, chặn không cho kéo video
  if (actualType.value !== 'image') {
    e.preventDefault();
    return;
  }

  if (e.dataTransfer && props.job.videoUrl) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: props.job.id,
      name: props.job.prompt,
      url: props.job.videoUrl,
      type: actualType.value
    }));
    e.dataTransfer.effectAllowed = 'copy';

    // Tạo hình ảnh thu nhỏ mượt mà khi kéo (Drag Ghost Image) chuẩn prod
    const dragGhost = document.createElement('div');
    dragGhost.style.width = '100px';
    dragGhost.style.height = '100px';
    dragGhost.style.borderRadius = '16px';
    dragGhost.style.backgroundImage = `url(${props.job.videoUrl})`;
    dragGhost.style.backgroundSize = 'cover';
    dragGhost.style.backgroundPosition = 'center';
    dragGhost.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    dragGhost.style.border = '2px solid rgba(255,255,255,0.8)';
    dragGhost.style.position = 'absolute';
    dragGhost.style.top = '-1000px';
    dragGhost.style.left = '-1000px';
    dragGhost.style.zIndex = '-1';
    
    document.body.appendChild(dragGhost);
    // Căn giữa ảnh nhỏ vào con trỏ chuột (50, 50 là tâm của hộp 100x100)
    e.dataTransfer.setDragImage(dragGhost, 50, 50);
    
    // Dọn dẹp DOM ngay sau khi trình duyệt đã chụp ảnh xong
    setTimeout(() => {
      if (document.body.contains(dragGhost)) {
        document.body.removeChild(dragGhost);
      }
    }, 0);
  }
};
</script>

<template>
  <div
    ref="containerRef"
    :draggable="actualType === 'image'"
    @dragstart="handleDragStart"
    :style="{ 
      flexGrow: aspectRatioValue, 
      flexBasis: `calc(250px * ${aspectRatioValue})`
    }"
    :class="[
      'group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-labs-gray transition-all select-none',
      actualType === 'image' ? 'cursor-pointer' : ''
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div :style="{ paddingBottom: `${(1 / aspectRatioValue) * 100}%` }" class="relative w-full h-0">
      <template v-if="job.videoUrl">
        <!-- Skeleton shimmer: hiển thị khi media chưa load xong, ẩn khi có lỗi -->
        <div
          v-if="!isLoaded && !imgError && !videoError"
          class="absolute inset-0 skeleton-shimmer"
        />

        <template v-if="actualType === 'image'">
          <img
            v-if="!imgError"
            :src="job.videoUrl"
            :class="[
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            ]"
            alt="Generated Image"
            loading="lazy"
            decoding="async"
            @load="handleMediaLoaded"
            @error="handleImgError"
          />
          <div v-else class="absolute inset-0 flex items-center justify-center bg-black/30">
            <span class="text-xs text-labs-gray">Không tải được ảnh</span>
          </div>
        </template>
        <template v-else>
          <video
            v-if="!videoError"
            ref="videoRef"
            :src="lazySrc || undefined"
            :class="[
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            ]"
            muted
            loop
            playsinline
            preload="metadata"
            @loadeddata="handleMediaLoaded"
            @loadedmetadata="handleLoadedMetadata"
            @error="handleVideoError"
          />
          <div v-else class="absolute inset-0 flex items-center justify-center bg-black/30">
            <span class="text-xs text-labs-gray">Không tải được video</span>
          </div>
        </template>
      </template>
      <div v-else class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/20">
        <template v-if="['WAITING', 'RUNNING', 'GENERATING', 'RENDERING'].includes(job.status)">
          <Loader2 class="w-8 h-8 text-labs-blue animate-spin mb-3" />
          <p class="text-sm text-labs-blue font-medium">{{ job.status }}</p>
        </template>
        <template v-else-if="job.status === 'FAILED'">
          <p class="text-sm text-labs-crimson font-medium">Lỗi tạo video</p>
        </template>
        <p class="text-xs text-labs-gray mt-2 line-clamp-2 italic">"{{ job.prompt }}"</p>
      </div>
    </div>

    <!-- Top Left Play Icon (Only if video exists and is a video job) -->
    <div v-if="job.videoUrl && actualType !== 'image'" class="absolute top-3 left-3 bg-black/50 p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
      <Play class="w-3 h-3 text-white fill-white" />
    </div>

    <!-- Hover Overlay for Download & Info -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
      <p class="text-sm text-labs-gainsboro font-medium line-clamp-2 mb-2">
        {{ job.prompt }}
      </p>
      <div class="flex items-center justify-between">
        <span class="text-xs text-labs-gray flex items-center gap-1">
          <Clock class="w-3 h-3" />
          {{ new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
        </span>
        
        <a 
          v-if="job.videoUrl"
          :href="job.videoUrl"
          :download="(job.prompt || 'video') + (actualType === 'image' ? '.png' : '.mp4')"
          target="_blank"
          rel="noreferrer"
          class="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full transition-colors"
          title="Tải xuống"
        >
          <Download class="w-4 h-4 text-white" />
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Skeleton shimmer animation — hiển thị trong khi media đang tải */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
