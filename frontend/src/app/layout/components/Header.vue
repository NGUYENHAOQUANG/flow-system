<script setup lang="ts">
import { 
  ArrowLeft, 
  MoreVertical, 
  Search, 
  Filter, 
  Plus, 
  HelpCircle, 
  Settings, 
  MoreHorizontal
} from 'lucide-vue-next';
import { computed } from 'vue';

const currentDate = computed(() => {
  return new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
});
</script>

<template>
  <header class="h-16 px-4 bg-labs-black flex items-center justify-between border-b border-white/10">
    <!-- Left -->
    <div class="flex items-center gap-4 text-labs-gainsboro">
      <button class="hover:bg-white/5 p-2 rounded-full transition-colors text-labs-dark-gray hover:text-labs-gainsboro">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <span class="font-medium text-sm">{{ currentDate }}</span>
      <button class="hover:bg-white/5 p-2 rounded-full transition-colors text-labs-dark-gray hover:text-labs-gainsboro">
        <MoreVertical class="w-5 h-5" />
      </button>
    </div>

    <!-- Center - Search -->
    <div class="flex-1 max-w-2xl mx-4 flex items-center gap-2">
      <div class="flex-1 bg-[#1e1f20] hover:bg-[#2a2b2f] transition-colors rounded-full flex items-center px-4 py-2 border border-transparent focus-within:border-white/10">
        <Search class="w-4 h-4 text-labs-gray mr-3" />
        <input 
          type="text" 
          placeholder="Search..." 
          class="bg-transparent border-none outline-none text-sm w-full text-white placeholder-labs-gray"
        />
      </div>
      <button class="bg-[#1e1f20] hover:bg-[#2a2b2f] p-2.5 rounded-full transition-colors">
        <Filter class="w-4 h-4 text-labs-gray" />
      </button>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-2 text-labs-dark-gray">
      <button class="hover:bg-white/5 hover:text-labs-gainsboro p-2 rounded-full transition-colors hidden sm:block">
        <Plus class="w-5 h-5" />
      </button>
      <button class="hover:bg-white/5 hover:text-labs-gainsboro p-2 rounded-full transition-colors hidden sm:block">
        <HelpCircle class="w-5 h-5" />
      </button>
      <button class="hover:bg-white/5 hover:text-labs-gainsboro p-2 rounded-full transition-colors hidden sm:block">
        <Settings class="w-5 h-5" />
      </button>
      <button class="hover:bg-white/5 hover:text-labs-gainsboro p-2 rounded-full transition-colors">
        <MoreHorizontal class="w-5 h-5" />
      </button>
      <div class="w-8 h-8 rounded-full bg-labs-blue flex items-center justify-center text-xs font-bold text-labs-black ml-2 cursor-pointer">
        U
      </div>
    </div>
  </header>
</template>
