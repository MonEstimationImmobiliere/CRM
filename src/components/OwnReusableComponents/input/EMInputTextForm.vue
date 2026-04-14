<template>
  <div class="custom-input-form">
    <div class="input-container">
      <label v-if="label" :class="['floating-label', floatingLabelClasses]" @click="focusInput">
        {{ label }}
      </label>

      <input
        ref="inputRef"
        :value="displayValue"
        :type="type"
        :placeholder="hasFloatingLabel ? '' : placeholder"
        :maxlength="maxlength"
        :readonly="readonly || disabled"
        :disabled="disabled"
        :class="inputClasses"
        class="custom-input"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
      />

      <button
        v-if="clearInput && modelValue && !disabled && !readonly"
        @click="clearValue"
        class="clear-button"
        type="button"
        tabindex="-1"
        aria-label="Clear input"
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
import { computed, ref, watch } from 'vue';

interface Props {
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  errorText?: string;
  showError?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  type?: string;
  maxlength?: number | string;
  clearInput?: boolean;
  // Date output format - if 'iso', appends T00:00:00 to date values
  dateOutputFormat?: 'default' | 'iso';
  // Style API
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  borderColor?: string;
  borderColorHover?: string;
  borderColorFocus?: string;
  borderRadius?: string;
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
  minimumHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  errorText: '',
  showError: true,
  readonly: false,
  disabled: false,
  type: 'text',
  maxlength: undefined,
  clearInput: false,
  dateOutputFormat: 'default',
  // Style defaults (mapped to ionic CSS vars so it blends in)
  variant: 'default',
  size: 'medium',
  borderColor: 'var(--ion-input-border-color)',
  borderColorHover: 'var(--ion-input-border-color-hover)',
  borderColorFocus: 'var(--ion-input-border-color-focus)',
  borderRadius: 'var(--ion-radius-lg)',
  backgroundColor: 'var(--ion-input-background-primary)',
  textColor: 'var(--ion-text-color)',
  placeholderColor: 'var(--ion-input-placeholder-color)',
  minimumHeight: 'auto',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  input: [event: Event];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);
const isHovered = ref(false);

const hasFloatingLabel = computed(() => !!props.label);

// For date inputs with ISO format, extract just the date part for display
const displayValue = computed(() => {
  if (props.type === 'date' && props.modelValue && typeof props.modelValue === 'string') {
    // Extract YYYY-MM-DD from ISO format (e.g., 2026-02-26T00:00:00 -> 2026-02-26)
    return props.modelValue.split('T')[0];
  }
  return props.modelValue;
});

const isLabelFloating = computed(() => {
  return isFocused.value || !!(props.modelValue && String(props.modelValue).length > 0);
});

const floatingLabelClasses = computed(() => ({
  'floating-label--active': isLabelFloating.value,
  'floating-label--error': props.errorText && props.showError,
  'floating-label--disable': props.disabled || props.readonly,
}));

const inputClasses = computed(() => [
  `custom-input--${props.variant}`,
  `custom-input--${props.size}`,
  {
    'custom-input--focused': isFocused.value,
    'custom-input--hovered': isHovered.value,
    'custom-input--error': props.errorText && props.showError,
    'custom-input--disabled': props.disabled || props.readonly,
    'custom-input--with-floating-label': hasFloatingLabel.value,
  },
]);

// Format date value based on dateOutputFormat prop
const formatDateValue = (value: string): string => {
  if (props.type !== 'date' || props.dateOutputFormat !== 'iso') {
    return value;
  }
  // If already in ISO format with time, return as-is
  if (value.includes('T')) {
    return value;
  }
  // Append T00:00:00 for ISO format
  return value ? `${value}T00:00:00` : value;
};

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = formatDateValue(target.value);
  emit('update:modelValue', value);
  emit('input', event);
};

const onBlur = (event: FocusEvent) => {
  isFocused.value = false;
  emit('blur', event);
};

const onFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit('focus', event);
};

const clearValue = () => {
  emit('update:modelValue', '');
  inputRef.value?.focus();
};

const focusInput = () => {
  inputRef.value?.focus();
};

// Keep native input in sync with external modelValue changes
watch(
  () => displayValue.value,
  (newValue) => {
    if (inputRef.value != null && inputRef.value.value !== String(newValue ?? '')) {
      inputRef.value.value = String(newValue ?? '');
    }
  }
);
</script>

<style scoped>
.custom-input-form {
  width: 100%;
}

.input-container {
  position: relative;
}

/* Floating label styles */
.floating-label {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: v-bind('props.placeholderColor');
  font-size: 16px;
  pointer-events: none;
  transition: all 0.2s ease-in-out;
  background-color: transparent;
  padding: 0;
  z-index: 2;
  user-select: none;
}

.floating-label--active {
  top: 0;
  left: 10px;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
  color: v-bind('props.borderColorFocus');
  background-color: var(--ion-input-background);
  padding: 0 4px;
}

.floating-label--error.floating-label--active {
  color: #ef4444;
}

/* Floating label size adjustments */
.custom-input--small ~ .floating-label {
  font-size: 14px;
  left: 12px;
}

.custom-input--small ~ .floating-label.floating-label--active {
  font-size: 11px;
  left: 8px;
}

.floating-label.floating-label--active.floating-label--disable {
  color: #6b7280;
}

.custom-input--medium ~ .floating-label.floating-label--active {
  font-size: 12px;
  left: 10px;
}

.custom-input--large ~ .floating-label {
  font-size: 18px;
  left: 18px;
}

.custom-input--large ~ .floating-label.floating-label--active {
  font-size: 13px;
  left: 14px;
}

.input-label {
  color: var(--ion-label-color, #6b7280);
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
  display: block;
}

.custom-input {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 16px;

  color: v-bind('props.textColor');
  background-color: v-bind('props.backgroundColor');
  border: 1px solid v-bind('props.borderColor');
  border-radius: v-bind('props.borderRadius');
  min-height: v-bind('props.minimumHeight');
  padding: 6px 14px;

  transition: all 0.2s ease-in-out;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

/* Ajustement du padding pour le label flottant */
.custom-input.custom-input--with-floating-label {
  /* padding-top: 18px;
  padding-bottom: 6px; */
}

.custom-input:hover:not(:disabled) {
  border-color: v-bind('props.borderColorHover');
}

.custom-input:focus:not(:disabled) {
  border-color: v-bind('props.borderColorFocus');
}

.custom-input.custom-input--error {
  border-color: #ef4444;
}

.custom-input::placeholder {
  color: v-bind('props.placeholderColor');
  opacity: 0.85;
}

.custom-input:disabled {
  color: var(--ion-text-color);
  background-color: var(--ion-input-background-disabled, #f5f5f7);
  border-color: var(--ion-border-color-light, #e5e7eb);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Size variants */
.custom-input.custom-input--small {
  padding: 8px 12px;
  font-size: 14px;
}

.custom-input.custom-input--small.custom-input--with-floating-label {
  padding-top: 14px;
  padding-bottom: 4px;
}

.custom-input.custom-input--large {
  padding: 16px 18px;
  font-size: 18px;
}

.custom-input.custom-input--large.custom-input--with-floating-label {
  padding-top: 22px;
  padding-bottom: 8px;
}

/* Variant styles */
.custom-input.custom-input--outlined {
  background-color: var(--ion-input-background, #fff);
  border-width: 2px;
}

.custom-input.custom-input--filled {
  background-color: var(--ion-input-background, #fff);
  border-color: transparent;
}

.custom-input.custom-input--filled:hover:not(:disabled) {
  background-color: var(--ion-input-background-hover, v-bind('props.backgroundColor'));
}

.custom-input.custom-input--filled:focus {
  background-color: v-bind('props.backgroundColor');
  border-color: v-bind('props.borderColorFocus');
}

/* Clear button */
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
  background-color: var(--ion-background-color-tertiary, rgba(107, 114, 128, 0.1));
}

/* Space for clear button */
.input-container:has(.clear-button) .custom-input {
  padding-right: 40px;
}

.error-message {
  margin-top: 6px;
  font-size: 12px;
  color: #ef4444;
  padding-left: 4px;
}
</style>
