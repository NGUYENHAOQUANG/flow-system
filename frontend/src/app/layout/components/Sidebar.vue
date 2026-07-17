<script setup lang="ts">
import { 
  Grid, 
  Image as ImageIcon, 
  Video, 
  User, 
  Clapperboard, 
  Wrench, 
  Trash2, 
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';

defineProps<{
  isCollapsed: boolean;
  activeTab?: string;
}>();

const emit = defineEmits<{
  (e: 'toggleCollapse'): void;
  (e: 'selectTab', id: string): void;
}>();

const menuItems = [
  { id: 'all', icon: Grid, label: 'Tất cả nội dung nghe nhìn' },
  { id: 'image', icon: ImageIcon, label: 'Hình ảnh' },
  { id: 'video', icon: Video, label: 'Video' },
  { id: 'character', icon: User, label: 'Nhân vật' },
  { id: 'scene', icon: Clapperboard, label: 'Cảnh' },
  { id: 'tool', icon: Wrench, label: 'Công cụ' },
];
</script>

<template>
  <aside 
    :class="[
      isCollapsed ? 'w-20' : 'w-64', 
      'transition-all duration-300 bg-labs-black border-r border-white/10 flex flex-col h-full text-sm text-labs-dark-gray shrink-0'
    ]"
  >
    <div class="flex-1 py-4 px-2 overflow-y-auto overflow-x-hidden">
      <ul class="space-y-1">
        <li v-for="(item, index) in menuItems" :key="index">
          <a 
            href="#" 
            @click.prevent="emit('selectTab', item.id)"
            :title="isCollapsed ? item.label : undefined"
            :class="[
              'flex items-center py-3 rounded-full hover:bg-white/5 transition-colors',
              isCollapsed ? 'justify-center px-0' : 'gap-4 px-4',
              (activeTab || 'all') === item.id ? 'bg-white/5 text-labs-gainsboro font-medium' : ''
            ]"
          >
            <component 
              :is="item.icon" 
              :class="['w-5 h-5 shrink-0', (activeTab || 'all') === item.id ? 'text-labs-blue' : 'text-labs-gray']" 
            />
            <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
          </a>
        </li>
      </ul>
    </div>

    <div class="p-2 border-t border-white/10">
      <ul class="space-y-1">
        <li>
          <a 
            href="#" 
            :title="isCollapsed ? 'Thùng rác' : undefined"
            :class="[
              'flex items-center py-3 rounded-full hover:bg-white/5 transition-colors text-labs-dark-gray',
              isCollapsed ? 'justify-center px-0' : 'gap-4 px-4'
            ]"
          >
            <Trash2 class="w-5 h-5 shrink-0 text-labs-gray" />
            <span v-if="!isCollapsed">Thùng rác</span>
          </a>
        </li>
        <li>
          <button 
            @click="emit('toggleCollapse')"
            :title="isCollapsed ? 'Mở rộng' : 'Thu gọn'"
            :class="[
              'w-full flex items-center py-3 rounded-full hover:bg-white/5 transition-colors text-labs-dark-gray',
              isCollapsed ? 'justify-center px-0' : 'gap-4 px-4'
            ]"
          >
            <ChevronRight v-if="isCollapsed" class="w-5 h-5 shrink-0 text-labs-gray" />
            <ChevronLeft v-else class="w-5 h-5 shrink-0 text-labs-gray" />
            <span v-if="!isCollapsed">Thu gọn</span>
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>
