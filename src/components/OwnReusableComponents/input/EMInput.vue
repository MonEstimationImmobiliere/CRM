<template>
  <div
    class="custom-input-wrapper"
    :class="{ 'has-clear-button': clearInput && modelValue && !disabled }"
  >
    <div class="input-container">
      <input
        ref="inputRef"
        v-bind="$attrs"
        :value="modelValue"
        :type="type"
        :placeholder="label ? (isFocused ? placeholder : '') : placeholder"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
        :class="inputClasses"
        :disabled="disabled"
        class="custom-input"
      />
      <label
        v-if="label"
        :class="labelClasses"
        class="input-label"
        @click="focusInput"
      >
        {{ label }}
      </label>
      <button
        v-if="clearInput && modelValue && !disabled"
        @click="clearValue"
        class="clear-button"
        type="button"
        tabindex="-1"
      >
        ✕
      </button>
    </div>
    <div v-if="errorText && showError" class="error-message">
      {{ errorText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue?: string | number;
  label?: string;
  errorText?: string;
  showError?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  borderColor?: string;
  borderColorHover?: string;
  borderColorFocus?: string;
  borderRadius?: string;
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  clearInput?: boolean;
  minimumHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  showError: true,
  variant: 'default',
  size: 'medium',
  borderColor: 'var(--ion-input-border-color)',
  borderColorHover: 'var(--ion-input-border-color-hover)',
  borderColorFocus: 'var(--ion-input-border-color-focus)',
  borderRadius: 'var(--ion-radius-lg)',
  backgroundColor: 'var(--ion-input-background)',
  textColor: 'var(--ion-text-color)',
  placeholderColor: 'var(--ion-input-placeholder-color)',
  disabled: false,
  type: 'text',
  placeholder: '',
  clearInput: false,
  minimumHeight: '48px',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  input: [event: Event];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const inputRef = ref();
const isFocused = ref(true);
const isHovered = ref(false);

const inputClasses = computed(() => [
  `custom-input--${props.variant}`,
  `custom-input--${props.size}`,
  {
    'custom-input--focused': isFocused.value,
    'custom-input--hovered': isHovered.value,
    'custom-input--error': props.errorText && props.showError,
    'custom-input--disabled': props.disabled,
  },
]);

const labelClasses = computed(() => [
  {
    'input-label--floating':
      isFocused.value ||
      (props.modelValue && props.modelValue.toString().length > 0),
    'input-label--error': props.errorText && props.showError,
    'input-label--disabled': props.disabled,
  },
]);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  emit('update:modelValue', value);
  emit('input', event);
};

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  emit('blur', event);
};

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit('focus', event);
};

const clearValue = () => {
  emit('update:modelValue', '');
  if (inputRef.value) {
    inputRef.value.focus();
  }
};

const focusInput = () => {
  if (inputRef.value && !props.disabled) {
    inputRef.value.focus();
  }
};

watch(
  () => props.modelValue,
  newValue => {
    if (inputRef.value) {
      inputRef.value.value = newValue;
    }
  }
);
</script>

<style scoped>
.custom-input-wrapper {
  position: relative;
  width: 100%;
}

.input-container {
  position: relative;
}

.custom-input {
  width: 100%;
  background-color: v-bind('props.backgroundColor');
  border-radius: v-bind('props.borderRadius');
  box-sizing: border-box;
  font-family: inherit;
  font-size: 14px;
  border: 1px solid var(--ion-input-border-color);
  padding: 12px 16px;
  min-height: v-bind('props.minimumHeight');
  transition: all 0.2s ease-in-out;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.custom-input:focus {
  border: 1px solid var(--ion-input-border-color);
}

.custom-input:hover {
  border: 1px solid var(--ion-input-border-color);
}

.custom-input::placeholder {
  color: v-bind('props.placeholderColor');
  opacity: 0.8;
}

.custom-input::-webkit-input-placeholder {
  color: v-bind('props.placeholderColor');
  opacity: 0.8;
}

.custom-input::-moz-placeholder {
  color: v-bind('props.placeholderColor');
  opacity: 0.8;
}

.custom-input:hover:not(:disabled):not(.custom-input--error) {
  border-color: v-bind('props.borderColorHover');
}

.custom-input:focus:not(.custom-input--error) {
  border-color: v-bind('props.borderColorFocus');
  /* box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); */
}

.custom-input.custom-input--error {
  border-color: #ef4444;
  color: #ef4444;
}

.custom-input.custom-input--error::placeholder {
  color: #fca5a5;
}

.custom-input.custom-input--error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.custom-input:disabled {
  color: var(--ion-text-color-disabled);
  background-color: var(--ion-input-background-color-disabled);
  border-color: var(--ion-input-border-color-disabled);
  cursor: not-allowed;
}

.custom-input:disabled::placeholder {
  color: var(--ion-input-placeholder-color-disabled, #9ca3af);
}

.custom-input.custom-input--small {
  padding: 8px 12px;
  font-size: 14px;
}

.custom-input.custom-input--large {
  padding: 16px 20px;
  font-size: 18px;
}

.custom-input.custom-input--outlined {
  background-color: var(--ion-input-background);
  border-width: 2px;
}

.custom-input.custom-input--filled {
  background-color: var(--ion-input-background);
  border-color: transparent;
}

.custom-input.custom-input--filled:hover:not(:disabled) {
  background-color: var(
    --ion-input-background-hover,
    v-bind('props.backgroundColor')
  );
}

.custom-input.custom-input--filled:focus {
  background-color: v-bind('props.backgroundColor');
  border-color: v-bind('props.borderColorFocus');
}

.error-message {
  margin-top: 4px;
  font-size: 12px;
  color: #ef4444;
  padding-left: 16px;
}

.custom-input-wrapper.has-clear-button {
  position: relative;
}

.clear-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ion-text-color-secondary, #6b7280);
  font-size: 16px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.clear-button:hover {
  background-color: var(
    --ion-background-color-tertiary,
    rgba(107, 114, 128, 0.1)
  );
}

.custom-input-wrapper.has-clear-button .custom-input {
  padding-right: 40px;
}

.input-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: v-bind('props.placeholderColor');
  pointer-events: none;
  transition: all 0.2s ease-in-out;
  background-color: v-bind('props.backgroundColor');
  padding: 0 4px;
  z-index: 1;
  cursor: text;
  border-radius: 3vmin;
}

.input-label--floating {
  top: 0;
  transform: translateY(-50%);
  font-size: 12px;
  color: v-bind('props.borderColorFocus');
  pointer-events: auto;
}

.input-label--error {
  color: #ef4444;
}

.input-label--error.input-label--floating {
  color: #ef4444;
}

.input-label--disabled {
  color: var(--ion-text-color-disabled, #6b7280);
}

.input-container:has(.input-label) .custom-input {
  padding-top: 12px;
}
</style>
