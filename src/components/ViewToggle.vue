<template>
  <div class="view-controls">
    <div class="layoutContainer">
      <div class="viewSelector">
        <div
          v-for="option in options"
          :key="option.value"
          class="grid-container"
          :class="{ disabled: option.disabled }"
          role="button"
          tabindex="0"
          :aria-label="option.label"
          :aria-pressed="modelValue === option.value"
          @click="select(option)"
          @keydown.enter="select(option)"
        >
          <el-icon class="view-icon" :class="{ active: modelValue === option.value }">
            <component :is="option.icon" />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

export interface ViewToggleOption {
  value: string;
  label: string;
  icon: Component;
  disabled?: boolean;
}

defineProps<{
  modelValue: string;
  options: ViewToggleOption[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const select = (option: ViewToggleOption) => {
  if (option.disabled) return;
  emit('update:modelValue', option.value);
};
</script>

<style scoped>
.view-controls {
  background-color: #eeeeee;
  padding: 14px 26px;
  border-radius: 35px;
}

.viewSelector {
  display: flex;
  gap: 12px;
  align-items: center;
}

.layoutContainer {
  display: flex;
  justify-content: center;
  max-width: 200px;
  margin: 0 auto;
}

.grid-container {
  cursor: pointer;
  padding: 8px 12px;
  border: 2px solid #337ecc;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  background: white;
}

.grid-container:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(51, 126, 204, 0.2);
}

.view-icon {
  font-size: 20px;
  color: #909399;
  transition:
    color 0.3s,
    transform 0.3s;
}

.view-icon:hover {
  transform: scale(1.1);
}

.view-icon.active {
  color: #337ecc;
  transform: scale(1.1);
}

.grid-container.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

@media (max-width: 768px) {
  .view-controls {
    padding: 8px 14px;
  }

  .grid-container {
    padding: 6px 10px;
  }

  .view-icon {
    font-size: 16px;
  }
}
</style>
