<template>
  <div class="sidebar-wrapper">
    <aside class="sidebar" :class="{ 'sidebar-closed': !sidebarOpen }">
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

    <!-- Toggle Button -->
    <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
      {{ sidebarOpen ? '←' : '→' }}
    </button>
  </div>
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

console.log('📍 MapView props.addresses dans SideBar:', props.addresses);

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
.sidebar-wrapper {
  position: relative;
  z-index: 20;
}

.sidebar {
  width: 320px;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 20;
  transition: margin-left 0.3s ease;
  border-right: 1px solid #e5e7eb;
  height: 100%;
  overflow: hidden;
}

.sidebar-closed {
  margin-left: -320px;
}

.sidebar-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  overflow-y: auto;
}

.sidebar-toggle {
  position: absolute;
  top: 1rem;
  left: 320px;
  z-index: 30;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
}

.sidebar-closed + .sidebar-toggle {
  left: 0;
}

.mode-controls h3,
.city-controls h3,
.street-search h3,
.stats-section h3,
.legend-section h3,
.debug-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}
</style>
