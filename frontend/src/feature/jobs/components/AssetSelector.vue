<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Video, 
  Volume2, 
  UserCheck, 
  Smile, 
  UploadCloud, 
  Search, 
  ChevronDown, 
  Upload, 
  Sparkles 
} from 'lucide-vue-next';
import { useJobStore } from '@/feature/jobs/store/useJobStore';

export interface Asset {
  id: number;
  name: string;
  type: 'image' | 'video' | 'voice' | 'character' | 'avatar' | 'upload';
  typeName: string;
  thumbnail: string;
  preview: string;
  rawFile?: File; // Tệp gốc từ thiết bị (dùng để upload R2 khi submit)
}

const emit = defineEmits<{
  (e: 'select', asset: Asset): void;
  (e: 'close'): void;
}>();

const jobStore = useJobStore();

// Dữ liệu mẫu (mock data) được lấy cảm hứng từ Google Flow và Unsplash
const mockAssets = ref<Asset[]>([
  {
    id: 1,
    name: 'Man wearing jacket and jersey',
    type: 'image',
    typeName: 'Hình ảnh',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    name: 'Nhân vật nam cổ trang',
    type: 'character',
    typeName: 'Nhân vật',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    name: 'Giọng đọc AI Nam Ấm Áp',
    type: 'voice',
    typeName: 'Giọng nói',
    thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&auto=format&fit=crop&q=80'
  },
  // {
  //   id: 4,
  //   name: 'Thác nước thiên nhiên hùng vĩ',
  //   type: 'video',
  //   typeName: 'Video',
  //   thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=100&auto=format&fit=crop&q=60',
  //   preview: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&auto=format&fit=crop&q=80'
  // },
  {
    id: 5,
    name: 'Rồng con nở từ trong trứng',
    type: 'image',
    typeName: 'Hình ảnh',
    thumbnail: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 6,
    name: 'Thung lũng phép thuật neon',
    type: 'image',
    typeName: 'Hình ảnh',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 7,
    name: 'Cô gái tiên cá dưới đại dương',
    type: 'character',
    typeName: 'Nhân vật',
    thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 8,
    name: 'Giọng đọc Nữ Trẻ Trung',
    type: 'voice',
    typeName: 'Giọng nói',
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 9,
    name: 'Thành phố tương lai cyberpunk.png',
    type: 'upload',
    typeName: 'Tệp tải lên',
    thumbnail: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 10,
    name: 'Chân dung Avatar Phép Thuật',
    type: 'avatar',
    typeName: 'Hình đại diện',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60',
    preview: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80'
  }
]);

const activeTab = ref<string>('all');
const searchQuery = ref<string>('');
const selectedAssetId = ref<number | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Track blob URLs tạo từ URL.createObjectURL để revoke khi unmount, tránh memory leak
const blobUrls: string[] = [];

onUnmounted(() => {
  blobUrls.forEach(url => URL.revokeObjectURL(url));
});

// Xử lý upload tệp tin từ máy tính qua hộp thoại
const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    let lastUploadedId: number | null = null;
    
    Array.from(target.files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        blobUrls.push(url); // Ghi nhớ để revoke sau
        const newAssetId = -Math.floor(Math.random() * 10000000);
        const newAsset: Asset = {
          id: newAssetId,
          name: file.name,
          type: 'upload',
          typeName: 'Tệp tải lên',
          thumbnail: url,
          preview: url,
          rawFile: file, // Lưu file gốc để upload R2 khi submit
        };
        jobStore.addUploadedAsset(newAsset);
        lastUploadedId = newAssetId;
      }
    });

    if (lastUploadedId !== null) {
      // Tự động chuyển tab và chọn ảnh vừa tải lên
      activeTab.value = 'upload';
      selectedAssetId.value = lastUploadedId;
    }
    
    // Reset giá trị input để có thể chọn lại cùng một tệp (nếu cần)
    target.value = '';
  }
};

// Danh sách trộn dữ liệu tải lên, dữ liệu thật và dữ liệu mẫu
const allAssets = computed<Asset[]>(() => {
  // 1. Ánh xạ các job tạo ảnh thành công từ store sang Asset
  const realAssets = jobStore.jobs
    .filter(job => job.videoUrl && job.type === 'image') // Chỉ lấy job hình ảnh đã hoàn thành
    .map((job, index) => ({
      // Đảm bảo ID duy nhất cho mỗi item (kể cả khi bị trùng lặp job.id do cơ chế lưu nhiều file của store)
      id: -(job.id * 1000 + index),
      name: job.prompt,
      type: 'image' as const,
      typeName: 'Hình ảnh',
      thumbnail: job.videoUrl!,
      preview: job.videoUrl!
    }));

  // 2. Trộn dữ liệu: Tải lên -> Thật -> Mẫu
  return [...jobStore.uploadedAssets, ...realAssets, ...mockAssets.value];
});

// Bộ lọc danh mục bên trái
const tabs = [
  { id: 'all', name: 'Tất cả', icon: LayoutDashboard },
  { id: 'image', name: 'Hình ảnh', icon: ImageIcon },
  // { id: 'video', name: 'Video', icon: Video },
  { id: 'voice', name: 'Giọng nói', icon: Volume2 },
  { id: 'character', name: 'Nhân vật', icon: UserCheck },
  { id: 'avatar', name: 'Hình đại diện', icon: Smile },
  { id: 'upload', name: 'Tệp tải lên', icon: UploadCloud }
];

// Lọc danh sách theo Tab và Ô tìm kiếm
const filteredAssets = computed(() => {
  return allAssets.value.filter(asset => {
    const matchesTab = activeTab.value === 'all' || asset.type === activeTab.value;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          asset.typeName.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesTab && matchesSearch;
  });
});

// Thành phần đang được chọn để xem trước
const selectedAsset = computed(() => {
  if (selectedAssetId.value !== null) {
    const found = allAssets.value.find(asset => asset.id === selectedAssetId.value);
    if (found) return found;
  }
  return filteredAssets.value[0] || null;
});

// Xử lý khi nhấn nút chọn
const handleAdd = () => {
  if (selectedAsset.value) {
    emit('select', selectedAsset.value);
    emit('close');
  }
};

// Xử lý khi click đúp vào dòng
const handleDoubleClick = (asset: Asset) => {
  emit('select', asset);
  emit('close');
};
</script>

<template>
  <div class="w-[800px] h-[450px] flex bg-[#161718]/90 backdrop-blur-xl text-white rounded-[24px] overflow-hidden select-none">
    
    <!-- CỘT 1: Sidebar trái (Danh mục) -->
    <div class="w-[200px] border-r border-white/10 flex flex-col p-3 bg-black/10">
      <!-- Tabs List -->
      <nav class="flex flex-col gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all w-full text-left font-medium',
            activeTab === tab.id 
              ? 'bg-[#dadce0]/10 text-white font-semibold shadow-inner' 
              : 'text-[#dadce0]/75 hover:bg-white/5 hover:text-white'
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="w-4 h-4 opacity-80" />
          <span>{{ tab.name }}</span>
        </button>
      </nav>

      <!-- Upload Button -->
      <input 
        type="file" 
        ref="fileInputRef" 
        accept="image/*" 
        multiple 
        class="hidden" 
        @change="handleFileUpload" 
      />
      <button 
        type="button" 
        @click="fileInputRef?.click()"
        class="mt-auto flex items-center justify-center gap-2 bg-[#dadce0]/5 hover:bg-white/10 text-white border border-white/5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
      >
        <Upload class="w-4 h-4 text-[#dadce0]/80" />
        <span>Tải nội dung lên</span>
      </button>
    </div>

    <!-- CỘT 2: Danh sách tài nguyên ở giữa -->
    <div class="w-[340px] border-r border-white/10 flex flex-col p-3">
      <!-- Search & Sort Row -->
      <div class="flex items-center gap-1.5 mb-2.5">
        <div class="flex-1 flex items-center gap-2 px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-xs">
          <Search class="w-3.5 h-3.5 text-[#dadce0]/40" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Tìm kiếm thành phần" 
            class="bg-transparent border-none outline-none text-white w-full placeholder-[#dadce0]/30 text-xs"
          />
        </div>
        <button 
          type="button"
          class="flex items-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-[#dadce0] transition-colors shrink-0"
        >
          <span class="text-[11px] font-medium">Gần đây</span>
          <ChevronDown class="w-3.5 h-3.5 text-[#dadce0]/50" />
        </button>
      </div>

      <!-- Assets Scrollable Area -->
      <div class="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 scrollbar-thin">
        <div
          v-for="asset in filteredAssets"
          :key="asset.id"
          :class="[
            'flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer',
            selectedAssetId === asset.id 
              ? 'bg-[#dadce0]/10 border-white/10 shadow-sm' 
              : 'bg-transparent border-transparent hover:bg-white/5'
          ]"
          @click="selectedAssetId = asset.id"
          @dblclick="handleDoubleClick(asset)"
        >
          <div class="w-10 h-10 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center shrink-0 border border-white/5">
            <img 
              v-if="asset.thumbnail"
              :src="asset.thumbnail" 
              :alt="asset.name" 
              class="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <Volume2 v-else class="w-5 h-5 text-[#dadce0]/50" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-semibold text-white truncate">{{ asset.name }}</div>
            <div class="text-[9px] text-[#dadce0]/50 mt-0.5 flex items-center gap-1">
              <span class="px-1 py-0.2 bg-white/5 rounded">{{ asset.typeName }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="filteredAssets.length === 0" class="text-center py-8 text-[#dadce0]/30 text-xs">
          Không tìm thấy thành phần nào
        </div>
      </div>
    </div>

    <!-- CỘT 3: Preview bên phải -->
    <div class="w-[260px] flex flex-col p-4 bg-black/5">
      <!-- Media Preview Area -->
      <div class="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-2xl overflow-hidden border border-white/5 p-2 mb-4 relative">
        <template v-if="selectedAsset">
          <img 
            v-if="selectedAsset.preview"
            :src="selectedAsset.preview" 
            :alt="selectedAsset.name" 
            class="w-full h-full object-cover rounded-lg"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="flex flex-col items-center gap-2 text-center p-4">
            <Volume2 class="w-12 h-12 text-[#dadce0]/30 animate-pulse" />
            <span class="text-[11px] text-[#dadce0]/50">{{ selectedAsset.name }}</span>
          </div>
        </template>
        <div v-else class="text-center text-xs text-[#dadce0]/30">
          Chọn một thành phần để xem trước
        </div>
      </div>

      <!-- Add to Prompt Button -->
      <button 
        type="button"
        :disabled="!selectedAsset"
        class="w-full py-2.5 bg-white text-black hover:bg-[#e2e2e2] disabled:bg-white/50 disabled:text-black/50 active:scale-[0.98] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
        @click="handleAdd"
      >
        <Sparkles class="w-4 h-4" />
        <span>Thêm vào câu lệnh</span>
      </button>
    </div>

  </div>
</template>

<style scoped>
/* Scrollbar Customization */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
