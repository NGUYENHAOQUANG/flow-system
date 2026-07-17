<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { Plus, ArrowRight, Loader2, ChevronDown, RectangleHorizontal, RectangleVertical, Square, XCircle, X } from 'lucide-vue-next';
import PromptSettings, { type PromptSettingsType } from './PromptSettings.vue';
import AssetSelector, { type Asset } from './AssetSelector.vue';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import { PopoverAnchor } from 'reka-ui';

const props = defineProps<{
  isSubmitting: boolean;
  activeTab?: string;
}>();

const emit = defineEmits<{
  (e: 'submit', prompt: string, model: string, duration: string, aspectRatio: string, quantity: string, tab: string, type: string, imageUrls: string[]): void;
}>();


const prompt = ref('');
const isSettingsOpen = ref(false);
const isAssetSelectorOpen = ref(false);
const attachedAssets = ref<Asset[]>([]);

const settings = ref<PromptSettingsType>({
  type: 'video',
  tab: 'thanh_phan',
  aspectRatio: '16:9',
  quantity: '1x',
  model: 'Veo 3.1 - Lite',
  duration: '8s'
});

watch(() => props.activeTab, (newVal) => {
  if (newVal === 'image') {
    settings.value.type = 'image';
    if (!settings.value.model.includes('Banana')) {
      settings.value.model = 'Nano Banana Pro';
    }
  } else if (newVal === 'video') {
    settings.value.type = 'video';
    if (settings.value.model.includes('Banana')) {
      settings.value.model = 'Veo 3.1 - Lite';
    }
  }
}, { immediate: true });

const BACKEND_API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Upload MỘT file đơn lên R2, trả về public URL hoặc null nếu lỗi.
 * Hàm này dùng để upload ngay lập tức khi file được thêm vào prompt.
 */
const uploadSingleFileToR2 = async (file: File): Promise<string | null> => {
  const safeFileName = `user-uploads/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  try {
    const res = await fetch(`${BACKEND_API}/storage/presigned-url?fileName=${encodeURIComponent(safeFileName)}&fileType=${encodeURIComponent(file.type)}`);
    if (!res.ok) throw new Error(`Presigned URL request failed: HTTP ${res.status}`);
    const { url: presignedUrl, publicUrl } = await res.json();

    await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    console.log(`[FloatingPrompt] Uploaded to R2: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`[FloatingPrompt] R2 upload failed for ${file.name}:`, err);
    return null;
  }
};

/**
 * Fallback: Upload tất cả các asset còn rawFile (upload eager thất bại).
 * Chỉ dùng ở submit time làm safety net.
 */
const uploadFilesToR2 = async (assets: Asset[]): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  for (const asset of assets) {
    if (!asset.rawFile) continue;
    const url = await uploadSingleFileToR2(asset.rawFile);
    if (url) uploadedUrls.push(url);
  }
  return uploadedUrls;
};

/**
 * Upload file lên R2 ngay lập tức, cập nhật URL trên asset khi xong.
 * Hiển thị blob URL trước để UX không bị delay, replace bằng R2 URL sau.
 */
const attachFileEagerly = async (file: File): Promise<void> => {
  const blobUrl = URL.createObjectURL(file);
  blobUrls.push(blobUrl);

  const assetId = -Math.floor(Math.random() * 10000000);
  const newAsset: Asset = {
    id: assetId,
    name: file.name,
    type: 'upload',
    typeName: 'Tệp tải lên',
    thumbnail: blobUrl,   // Hiển thị ngay với blob URL
    preview: blobUrl,
    rawFile: file,        // Giữ rawFile làm fallback nếu upload lỗi
  };
  attachedAssets.value.push(newAsset);

  // Upload R2 ngay lập tức (không await ở đây để không block UX)
  uploadSingleFileToR2(file).then(r2Url => {
    if (!r2Url) return; // Upload lỗi → giữ nguyên rawFile để fallback ở submit

    const idx = attachedAssets.value.findIndex(a => a.id === assetId);
    if (idx === -1) return; // Asset đã bị user xoá trong lúc upload

    // Cập nhật sang R2 URL và xoá rawFile (đã upload xong, không cần upload lại)
    attachedAssets.value[idx] = {
      ...attachedAssets.value[idx],
      thumbnail: r2Url,
      preview: r2Url,
      rawFile: undefined,
    };
    // Giải phóng blob URL vì đã có R2 URL thay thế
    URL.revokeObjectURL(blobUrl);
  });
};

const handleSubmit = async () => {
  if ((!prompt.value.trim() && attachedAssets.value.length === 0) || props.isSubmitting) return;

  // 1. Các ảnh từ thiết bị đã được upload eager → có R2 URL trong thumbnail
  //    Nếu còn asset nào vẫn còn rawFile (upload eager thất bại) → fallback upload
  const assetsStillPending = attachedAssets.value.filter(a => a.rawFile);
  const fallbackUrls = assetsStillPending.length > 0 ? await uploadFilesToR2(assetsStillPending) : [];

  // 2. Thu thập tất cả public URL (R2) — bao gồm eager-uploaded và app-internal
  const publicUrls = attachedAssets.value
    .filter(a => !a.rawFile && a.thumbnail)
    .map(a => a.thumbnail);

  const imageUrls = [...publicUrls, ...fallbackUrls];

  // 3. Ghép các thành phần đính kèm vào đầu câu lệnh
  let finalPrompt = prompt.value;
  const nonImageAssets = attachedAssets.value.filter(a => a.type !== 'image' && a.type !== 'upload');
  if (nonImageAssets.length > 0) {
    const refs = nonImageAssets.map(a => `@${a.name}`).join(' ');
    finalPrompt = `${refs} ${finalPrompt}`.trim();
  }

  emit('submit', finalPrompt, settings.value.model, settings.value.duration, settings.value.aspectRatio, settings.value.quantity, settings.value.tab, settings.value.type, imageUrls);
  prompt.value = '';
  attachedAssets.value = [];
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
};

const handleSelectAsset = (asset: Asset) => {
  if (!attachedAssets.value.some(a => a.thumbnail === asset.thumbnail)) {
    if (asset.rawFile) {
      // Asset có rawFile (tải lên từ thiết bị qua AssetSelector) → upload R2 ngay
      attachFileEagerly(asset.rawFile);
    } else {
      // Asset đã có URL public (ảnh trong hệ thống) → thêm trực tiếp
      const clonedAsset = { ...asset, id: -Math.floor(Math.random() * 10000000) };
      attachedAssets.value.push(clonedAsset);
    }
  }
};

const removeAsset = (assetId: number) => {
  attachedAssets.value = attachedAssets.value.filter(a => a.id !== assetId);
};

// Drag & Drop
const isDraggingOver = ref(false);
let dragCounter = 0;

// Track blob URLs tạo từ drag-drop tệp để revoke khi unmount, tránh memory leak
const blobUrls: string[] = [];

onUnmounted(() => {
  blobUrls.forEach(url => URL.revokeObjectURL(url));
});

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  dragCounter++;
  isDraggingOver.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    isDraggingOver.value = false;
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  dragCounter = 0;
  isDraggingOver.value = false;

  if (e.dataTransfer) {
    // 1. Ưu tiên: Kéo thả file từ hệ điều hành (OS)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      let fileProcessed = false;
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          fileProcessed = true;
          // Upload R2 ngay lập tức, hiển thị blob URL tạm trong khi đợi
          attachFileEagerly(file);
        }
      });
      if (fileProcessed) return;
    }

    // 2. Fallback: Kéo thả card từ trong ứng dụng (JSON data với R2 URL sẵn)
    const dataStr = e.dataTransfer.getData('text/plain');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (data && data.url) {
          if (!attachedAssets.value.some(a => a.thumbnail === data.url)) {
            const newAsset: Asset = {
              id: -Math.floor(Math.random() * 10000000),
              name: data.name,
              type: 'image',
              typeName: 'Hình ảnh',
              thumbnail: data.url,
              preview: data.url
              // rawFile không có vì đây là ảnh từ trong hệ thống (đã có R2 URL)
            };
            attachedAssets.value.push(newAsset);
          }
        }
      } catch (err) {
        console.error('Error parsing drag data:', err);
      }
    }
  }
};
</script>

<template>
  <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
    <Popover v-model:open="isAssetSelectorOpen">
      <PopoverAnchor as-child>
        <form 
          @submit.prevent="handleSubmit"
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          @dragover.prevent
          @drop="handleDrop"
          class="relative bg-[#161718]/90 backdrop-blur-xl border border-white/10 rounded-[24px] flex flex-col p-2 shadow-2xl transition-all focus-within:border-white/20 focus-within:bg-[#1a1b1c]"
        >
          <!-- Drop Zone Overlay -->
          <div 
            v-if="isDraggingOver"
            class="absolute inset-0 bg-[#161718]/95 backdrop-blur-xl border-2 border-dashed border-white/20 rounded-[24px] flex items-center justify-center text-xs font-semibold text-[#dadce0] gap-2 transition-all z-10 pointer-events-none"
          >
            <Plus class="w-4 h-4" />
            <span>Thêm thành phần</span>
          </div>
          <!-- Attached Assets Row -->
          <div v-if="attachedAssets.length > 0" class="flex items-center justify-between px-3 pt-2 pb-1 border-b border-white/5 mb-1">
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="asset in attachedAssets" 
                :key="asset.id" 
                class="relative group w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0"
              >
                <img 
                  :src="asset.thumbnail || asset.preview" 
                  :alt="asset.name" 
                  class="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <!-- Delete button overlay -->
                <button 
                  type="button" 
                  class="absolute inset-0 flex items-center justify-center bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  @click="removeAsset(asset.id)"
                >
                  <XCircle class="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <!-- Clear all button -->
            <button 
              type="button" 
              class="text-[#dadce0]/50 hover:text-white p-1 rounded-full transition-colors cursor-pointer mr-1"
              @click="attachedAssets = []"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <textarea
            v-model="prompt"
            @keydown="handleKeyDown"
            placeholder="Bạn muốn tạo gì?"
            class="w-full bg-transparent border-none outline-none text-labs-gainsboro px-4 py-3 text-sm placeholder-labs-gray resize-none h-16"
            :disabled="isSubmitting"
          />
          
          <div class="flex items-center justify-between px-1">
            <!-- Left -->
            <PopoverTrigger asChild>
              <button 
                type="button" 
                :class="[
                  'flex items-center justify-center gap-2 px-3 h-[34px] rounded-full transition-all text-[11px] font-medium',
                  isAssetSelectorOpen ? 'bg-white/20 text-white' : 'bg-[#dadce0]/5 text-[#dadce0]/75 hover:bg-white/20'
                ]"
              >
                <Plus class="w-4 h-4" />
              </button>
            </PopoverTrigger>

            <!-- Right -->
            <div class="flex items-center gap-2 relative">
              <Popover v-model:open="isSettingsOpen">
                <PopoverTrigger asChild>
                  <button 
                    type="button"
                    :class="[
                      'flex items-center justify-center gap-1.5 px-3 h-[34px] rounded-full transition-colors text-[11px] font-medium',
                      isSettingsOpen ? 'bg-white/20 text-white' : 'bg-[#dadce0]/5 text-[#dadce0]/75 hover:bg-white/20'
                    ]"
                  >
                    <template v-if="settings.type === 'video'">
                      Video • {{ settings.duration }}
                    </template>
                    <span v-else class="flex items-center gap-1">
                      <span v-if="settings.model.includes('Banana')">🍌</span>
                      {{ settings.model }}
                    </span>
                    
                    <RectangleHorizontal v-if="settings.aspectRatio === '16:9' || settings.aspectRatio === '4:3'" class="w-3 h-3 mx-0.5 opacity-70" />
                    <Square v-else-if="settings.aspectRatio === '1:1'" class="w-3 h-3 mx-0.5 opacity-70" />
                    <RectangleVertical v-else class="w-3 h-3 mx-0.5 opacity-70" />
                    
                    {{ settings.quantity }}
                    <ChevronDown class="w-3 h-3 ml-0.5" />
                  </button>
                </PopoverTrigger>
                
                <PopoverContent 
                  class="w-[280px] p-2 bg-[#161718]/95 backdrop-blur-xl border-white/10 rounded-[24px]"
                  align="end" 
                  :sideOffset="12"
                >
                  <PromptSettings 
                    :settings="settings" 
                    :active-tab="activeTab"
                    @update="settings = $event" 
                    @close="isSettingsOpen = false" 
                  />
                </PopoverContent>
              </Popover>

              <button
                type="submit"
                :disabled="!prompt.trim() || isSubmitting"
                class="bg-white/10 text-labs-gainsboro hover:bg-white/20 disabled:bg-white/5 disabled:text-white/20 w-[34px] h-[34px] rounded-full transition-all flex items-center justify-center"
              >
                <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                <ArrowRight v-else class="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </PopoverAnchor>
      <PopoverContent side="top" :sideOffset="12" align="center" class="w-auto p-0 bg-transparent border-none rounded-[24px] shadow-2xl overflow-hidden z-50">
        <AssetSelector @select="handleSelectAsset" @close="isAssetSelectorOpen = false" />
      </PopoverContent>
    </Popover>
  </div>
</template>
