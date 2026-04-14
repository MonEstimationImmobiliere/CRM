<template>
  <div class="em-number-input" :class="{ disabled: disabled }">
    <label v-if="label" class="number-input-label">{{ label }}</label>
    <div class="number-input-container">
      <button
        v-if="showButtons"
        type="button"
        class="number-btn decrement"
        :disabled="disabled || isAtMin"
        @click="decrement"
        aria-label="Diminuer"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M19 13H5v-2h14v2z" />
        </svg>
      </button>

      <input
        ref="inputRef"
        type="text"
        inputmode="decimal"
        class="number-input"
        :value="modelValue"
        :disabled="disabled"
        :placeholder="placeholder"
        @input="handleInput"
        @keydown="filterKeydown"
        @blur="handleBlur"
      />

      <span v-if="suffix" class="number-input-suffix">{{ suffix }}</span>

      <button
        v-if="showButtons"
        type="button"
        class="number-btn increment"
        :disabled="disabled || isAtMax"
        @click="increment"
        aria-label="Augmenter"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
    </div>
    <span v-if="errorText" class="number-input-error">{{ errorText }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  modelValue: number;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
  errorText?: string;
  showButtons?: boolean;
  suffix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: Infinity,
  step: 1,
  disabled: false,
  placeholder: '0',
  showButtons: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const isAtMin = computed(() => props.modelValue <= props.min);
const isAtMax = computed(() => props.modelValue >= props.max);

const ALLOWED_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
]);

const filterKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    increment();
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    decrement();
    return;
  }

  // Allow ctrl/cmd shortcuts (copy, paste, select all…)
  if (event.metaKey || event.ctrlKey) return;

  // Allow navigation & editing keys
  if (ALLOWED_KEYS.has(event.key)) return;

  // Allow digits
  if (/^\d$/.test(event.key)) return;

  // Allow a single decimal point
  const target = event.target as HTMLInputElement;
  if (event.key === '.' && !target.value.includes('.')) return;

  // Block everything else
  event.preventDefault();
};

const clampValue = (value: number): number => {
  if (isNaN(value)) return props.min;
  return Math.min(Math.max(value, props.min), props.max);
};

const updateValue = (newValue: number) => {
  const clampedValue = clampValue(newValue);
  emit('update:modelValue', clampedValue);
  emit('change', clampedValue);
};

const increment = () => {
  if (!isAtMax.value) {
    updateValue(props.modelValue + props.step);
  }
};

const decrement = () => {
  if (!isAtMin.value) {
    updateValue(props.modelValue - props.step);
  }
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  // Sanitize any value that bypasses keydown (e.g. paste)
  const sanitized = target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
  if (sanitized !== target.value) {
    target.value = sanitized;
  }
  const value = parseFloat(sanitized);
  if (!isNaN(value)) {
    emit('update:modelValue', value);
  }
};

const handleBlur = () => {
  // Clamp value on blur
  updateValue(props.modelValue);
};
</script>

<style scoped>
.em-number-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 250px;
}

.number-input-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color, #333);
}

.number-input-container {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--ion-input-background, #fff);
  border: 1px solid var(--ion-input-border-color, #e0e0e0);
  border-radius: var(--ion-radius-xl, 16px);
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.number-input-container:hover:not(.disabled) {
  border-color: var(--ion-input-border-color-hover, #999);
}

.number-input-container:focus-within {
  border-color: var(--ion-input-border-color-focus, var(--ion-color-primary));
}

.number-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 44px;
  border: 1px solid var(--ion-input-border-color, #e0e0e0);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  color: var(--ion-text-color-secondary, #666);
  transition: all 0.2s ease;
}

.number-btn:hover:not(:disabled) {
  background: var(--ion-background-color-step-50, #f5f5f5);
  color: var(--ion-color-primary, #3880ff);
}

.number-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.number-input {
  flex: 1;
  min-width: 60px;
  height: 44px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: var(--ion-text-color, #333);
  outline: none;
  appearance: textfield;
  -moz-appearance: textfield;
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input::placeholder {
  color: var(--ion-input-placeholder-color, #999);
}

.number-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.em-number-input.disabled .number-input-container {
  opacity: 0.6;
  cursor: not-allowed;
}

.number-input-error {
  font-size: 12px;
  color: var(--ion-color-danger, #eb445a);
}

.number-input-suffix {
  display: flex;
  align-items: center;
  padding-right: 12px;
  font-size: 16px;
  font-weight: 500;
  color: var(--ion-text-color-secondary, #666);
  user-select: none;
  pointer-events: none;
}
</style>
