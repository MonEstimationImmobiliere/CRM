<template>
  <div class="topbar">
    <span class="topbar-label">Mode</span>
    <div class="mode-pills">
      <button
        v-for="mode in MAP_MODES"
        :key="mode.value"
        :class="['pill', { active: currentMode === mode.value }]"
        :aria-pressed="currentMode === mode.value"
        @click="setMode(mode.value)"
      >
        <span class="pill-dot" :style="{ background: COLORS[mode.value] }" />
        {{ mode.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { IAddressDetail } from '@/types/address';
import { MAP_MODES, COLORS, type MapDisplayMode } from '@/utils/mapConstants';

defineProps<{
  addresses: IAddressDetail[];
}>();

const emit = defineEmits<{
  'mode-change': [mode: string];
}>();

const currentMode = ref<MapDisplayMode>('prospection');

const setMode = (mode: string) => {
  currentMode.value = mode as MapDisplayMode;
  emit('mode-change', mode);
};
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  background: var(--apple-card-bg);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  z-index: 10;
  position: relative;
}

.topbar-label {
  font-size: 12px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.mode-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: #f5f5f7;
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto,
    sans-serif;
}

.pill:hover {
  background: #e8e8ed;
  transform: translateY(-1px);
}

.pill:active {
  transform: translateY(0);
}

.pill.active {
  background: #0071e3;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.3);
}

.pill.active .pill-dot {
  background: #fff !important;
}

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
