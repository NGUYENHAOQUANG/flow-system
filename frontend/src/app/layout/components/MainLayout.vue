<script setup lang="ts">
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';

defineProps<{
  isCollapsed: boolean;
  activeTab?: string;
}>();

const emit = defineEmits<{
  (e: 'toggleCollapse'): void;
  (e: 'selectTab', id: string): void;
}>();
</script>

<template>
  <div class="flex h-screen w-full bg-labs-black overflow-hidden">
    <Sidebar :is-collapsed="isCollapsed" :active-tab="activeTab" @toggle-collapse="emit('toggleCollapse')" @select-tab="emit('selectTab', $event)" />
    <div class="flex-1 flex flex-col h-full overflow-hidden relative">
      <Header />
      <main class="flex-1 overflow-y-auto p-4">
        <slot></slot>
      </main>
    </div>
  </div>
</template>
