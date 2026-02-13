<template>
  <aside class="sidebar">
    <div class="sidebar-content">
      <div class="mode-controls">
        <h3>Mode d'affichage</h3>
        <div class="mode-buttons">
          <button
            v-for="mode in selectPropertyToDisplay"
            :key="mode.value"
            :class="['mode-btn', { active: currentMode === mode.value }]"
            @click="setMode(mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { IAddressDetail } from '@/types/address';

// Emits
const emit = defineEmits<{
  'mode-change': [mode: string];
  'sidebar-toggle': [open: boolean];
}>();

const props = defineProps<{
  addresses: IAddressDetail[];
}>();

// État réactif
const sidebarOpen = ref(true);
const currentMode = ref<
  'prospection' | 'estimation' | 'rappel' | 'favoris' | 'dpe'
>('prospection');

// Modes d'affichage
const selectPropertyToDisplay = [
  { value: 'prospection', label: 'Prospection' },
  { value: 'estimation', label: 'Estimations' },
  { value: 'rappel', label: 'Rappels' },
  { value: 'favoris', label: 'Favoris' },
  { value: 'dpe', label: 'DPE' },
];

const setMode = (mode: string) => {
  currentMode.value = mode as any;
  emit('mode-change', mode);
};

// Keyboard handler
const handleGlobalKeydown = (event: KeyboardEvent) => {
  // Toggle sidebar with Escape key
  if (event.key === 'Escape') {
    sidebarOpen.value = !sidebarOpen.value;
    emit('sidebar-toggle', sidebarOpen.value);
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<style scoped>
.sidebar {
  padding: 20px;
  width: 240px;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-controls h3 {
  font-size: 13px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.mode-buttons {
  display: flex;
  gap: 8px;
  flex-direction: column;
}

.mode-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  background: #f5f5f7;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto,
    sans-serif;
}

.mode-btn:hover {
  background: #e8e8ed;
  transform: scale(1.02);
}

.mode-btn:active {
  transform: scale(0.98);
}

.mode-btn.active {
  background: #0071e3;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.3);
}

.mode-btn.active:hover {
  background: #0077ed;
}
</style>
