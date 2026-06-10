<template>
  <div class="search-container" :class="{ 'is-mobile': isMobile }">
    <div class="icon-wrapper" :class="{ 'with-bg': iconSearchBG }">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
    </div>
    <input
      ref="inputRef"
      type="text"
      :placeholder="placeholder"
      :value="modelValue"
      @input="handleInput"
      class="search-input"
      :class="{ 'is-mobile': isMobile }"
    />
    <div
      v-if="modelValue && modelValue.trim().length > 0"
      class="clear-icon-wrapper"
      @click="handleClear"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="clear-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import useIsMobile from '../../../composables/isMobile';

const isMobile = useIsMobile();
const inputRef = ref<HTMLInputElement>();

const focus = () => {
  inputRef.value?.focus();
};

defineExpose({ focus });

defineProps<{
  modelValue?: string;
  placeholder?: string;
  iconSearchBG?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const handleClear = () => {
  emit('update:modelValue', '');
};
</script>

<style scoped>
.search-container {
  display: flex;
  align-items: center;
  background-color: var(--ion-background-color);
  border-radius: var(--ion-radius-lg);
  padding: 2px 2px;
  width: auto;
  border: 1px solid var(--ion-input-border-color);
  height: 40px;
}

.search-container:hover {
  border-color: var(--ion-input-border-color-hover);
}

.search-container.is-mobile {
  width: 100%;
  height: 50px;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border-radius: 50%;
  width: 52px;
  height: 52px;
  margin-right: 2px;
}

.icon-wrapper.with-bg {
  background-color: var(--ion-icon-background-color);
}

.icon {
  width: 16px;
  height: 16px;
  color: #555;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: 14px;
  color: var(--ion-text-color);
  margin-left: 10px;
}

.search-input.is-mobile {
  font-size: 1.1rem;
}

.search-input::placeholder {
  color: var(--ion-text-color-secondary);
}

.clear-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  margin-right: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-icon-wrapper:hover {
  transform: scale(1.05);
}

.clear-icon {
  width: 14px;
  height: 14px;
  color: #555;
}
</style>
