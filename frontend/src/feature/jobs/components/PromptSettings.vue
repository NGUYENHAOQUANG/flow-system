<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Image as ImageIcon, 
  Video, 
  ChevronDown, 
  RectangleHorizontal, 
  RectangleVertical, 
  Frame, 
  Component as ComponentIcon, 
  Volume2, 
  Square 
} from 'lucide-vue-next';

export interface PromptSettingsType {
  type: 'image' | 'video';
  tab: 'khung_hinh' | 'thanh_phan';
  aspectRatio: string;
  quantity: string;  // Số video tạo một lần: '1x' | 'x2' | 'x3' | 'x4'
  model: string;
  duration: string;
}

const props = defineProps<{
  settings: PromptSettingsType;
  activeTab?: string;
}>();

const emit = defineEmits<{
  (e: 'update', settings: PromptSettingsType): void;
  (e: 'close'): void;
}>();

const aspectRatios = [
  { id: '9:16', icon: RectangleVertical },
  { id: '16:9', icon: RectangleHorizontal },
  { id: '4:3', icon: RectangleHorizontal },
  { id: '1:1', icon: Square },
  { id: '3:4', icon: RectangleVertical },
];

const quantities = ['1x', 'x2', 'x3', 'x4'];
const models = [
  'Omni Flash', 'Veo 3.1 - Lite', 'Veo 3.1 - Fast', 'Veo 3.1 - Quality', 
  'Nano Banana Pro', 'Nano Banana 2', 'Nano Banana 2 Lite'
];

const availableDurations = computed(() => {
  if (props.settings.model === 'Omni Flash') {
    return ['4s', '6s', '8s', '10s'];
  }
  return ['4s', '6s', '8s'];
});

const totalCredits = computed(() => {
  if (props.settings.type === 'image') return 0;
  
  let baseCost = 5; // Mặc định cho các model khác
  
  if (props.settings.model === 'Omni Flash') {
    switch (props.settings.duration) {
      case '4s': baseCost = 7; break;
      case '6s': baseCost = 10; break;
      case '8s': baseCost = 12; break;
      case '10s': baseCost = 15; break;
      default: baseCost = 7;
    }
  } else if (props.settings.model === 'Veo 3.1 - Fast') {
    baseCost = 10;
  } else if (props.settings.model === 'Veo 3.1 - Quality') {
    baseCost = 100;
  }
  
  // '1x' -> 1, 'x2' -> 2
  const qStr = props.settings.quantity.replace('x', '');
  const multiplier = parseInt(qStr, 10) || 1;
  
  return baseCost * multiplier;
});

const isModelDropdownOpen = ref(false);

const update = (key: keyof PromptSettingsType, value: string) => {
  const newSettings = { ...props.settings, [key]: value };
  
  // Reset duration về 8s nếu chuyển model không hỗ trợ 10s
  if (key === 'model' && value !== 'Omni Flash' && newSettings.duration === '10s') {
    newSettings.duration = '8s';
  }
  
  emit('update', newSettings);
};
</script>

<template>
  <div class="flex flex-col gap-2 text-sm font-medium">
    <!-- Type Tabs -->
    <div v-if="!activeTab || activeTab === 'all'" class="flex bg-black/20 rounded-2xl p-1 gap-1">
      <button 
        type="button"
        :class="['flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-xl transition-colors', settings.type === 'image' ? 'bg-[#e2e2e2] text-black' : 'text-[#dadce0] hover:bg-white/10']"
        @click="emit('update', { ...settings, type: 'image', model: 'Nano Banana Pro' })"
      >
        <ImageIcon class="w-4 h-4" /> Hình ảnh
      </button>
      <button 
        type="button"
        :class="['flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-xl transition-colors', settings.type === 'video' ? 'bg-[#e2e2e2] text-black' : 'text-[#dadce0] hover:bg-white/10']"
        @click="emit('update', { ...settings, type: 'video', model: 'Veo 3.1 - Lite' })"
      >
        <Video class="w-4 h-4" /> Video
      </button>
    </div>

    <!-- Sub Tabs (Only for Video) -->
    <!--
    <div v-if="settings.type === 'video'" class="flex bg-black/20 rounded-2xl p-1 gap-1">
      <button 
        type="button"
        :class="['flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-xl transition-colors', settings.tab === 'khung_hinh' ? 'bg-[#e2e2e2] text-black' : 'text-[#dadce0] hover:bg-white/10']"
        @click="update('tab', 'khung_hinh')"
      >
        <Frame class="w-4 h-4" /> Khung hình
      </button>
      <button 
        type="button"
        :class="['flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-xl transition-colors', settings.tab === 'thanh_phan' ? 'bg-[#e2e2e2] text-black' : 'text-[#dadce0] hover:bg-white/10']"
        @click="update('tab', 'thanh_phan')"
      >
        <ComponentIcon class="w-4 h-4" /> Thành phần
      </button>
    </div>
    -->

    <!-- Aspect Ratios -->
    <div class="flex bg-black/20 rounded-2xl p-1 gap-1">
      <button
        v-for="ar in (settings.type === 'video' ? aspectRatios.filter(a => a.id === '9:16' || a.id === '16:9') : aspectRatios)"
        :key="ar.id"
        type="button"
        :class="['flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-colors', settings.aspectRatio === ar.id ? 'bg-[#5f6368] text-white' : 'text-[#dadce0] hover:bg-white/10']"
        @click="update('aspectRatio', ar.id)"
      >
        <component :is="ar.icon" class="w-4 h-4 mb-1" />
        <span class="text-[10px] font-semibold">{{ ar.id }}</span>
      </button>
    </div>

    <!-- Quantity (số video tạo một lần) -->
    <div class="flex bg-black/20 rounded-2xl p-1 gap-1">
      <button
        v-for="q in quantities"
        :key="q"
        type="button"
        :class="['flex-1 flex items-center justify-center py-2 rounded-xl transition-colors text-xs font-semibold', settings.quantity === q ? 'bg-[#5f6368] text-white' : 'text-[#dadce0] hover:bg-white/10']"
        @click="update('quantity', q)"
      >
        {{ q }}
      </button>
    </div>

    <!-- Model Selector -->
    <div class="relative mt-1">
      <button
        type="button"
        class="w-full flex items-center justify-between bg-black/20 hover:bg-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-[#dadce0] transition-colors"
        @click="isModelDropdownOpen = !isModelDropdownOpen"
      >
        <span class="flex items-center gap-2">
          <span v-if="settings.model.includes('Banana')">🍌</span> {{ settings.model }}
        </span>
        <ChevronDown :class="['w-4 h-4 transition-transform', isModelDropdownOpen ? 'rotate-180' : '']" />
      </button>
      
      <div v-if="isModelDropdownOpen" class="absolute bottom-full left-0 w-full mb-2 bg-[#161718]/95 backdrop-blur-xl border border-white/10 rounded-[24px] p-2 shadow-2xl z-50">
        <button
          v-for="m in models.filter(m => settings.type === 'video' ? !m.includes('Banana') : m.includes('Banana'))"
          :key="m"
          type="button"
          :class="['w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold text-left transition-colors', settings.model === m ? 'bg-white/10 text-white' : 'text-[#dadce0] hover:bg-white/5']"
          @click="update('model', m); isModelDropdownOpen = false"
        >
          <span v-if="m.includes('Banana')">🍌</span>
          <Volume2 v-else class="w-5 h-5" />
          <span>{{ m }}</span>
        </button>
      </div>
    </div>

    <!-- Durations (only if video) -->
    <div v-if="settings.type === 'video'" class="flex bg-black/20 rounded-2xl p-1 gap-1 mt-1">
      <button
        v-for="d in availableDurations"
        :key="d"
        type="button"
        :class="['flex-1 flex items-center justify-center py-2 rounded-xl transition-colors text-xs font-semibold', settings.duration === d ? 'bg-[#5f6368] text-white' : 'text-[#dadce0] hover:bg-white/10']"
        @click="update('duration', d)"
      >
        {{ d }}
      </button>
    </div>

    <!-- Footer -->
    <div class="text-center pt-2 pb-1">
      <p class="text-[11px] text-[#dadce0]">
        Quá trình tạo sẽ tốn <span class="underline cursor-pointer hover:text-white transition-colors decoration-white/30 underline-offset-2">{{ totalCredits }} tín dụng</span>
      </p>
    </div>
  </div>
</template>
