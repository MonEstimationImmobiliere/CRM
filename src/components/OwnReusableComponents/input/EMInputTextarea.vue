<template>
  <div class="em-textarea-wrapper">
    <div class="textarea-container">
      <textarea
        ref="textareaRef"
        v-bind="$attrs"
        :value="modelValue"
        :placeholder="label ? (isFocused ? placeholder : '') : placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :rows="rows"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        :class="textareaClasses"
        class="em-textarea"
      />
      <label v-if="label" :class="labelClasses" class="textarea-label" @click="focusTextarea">
        {{ label }}
      </label>
    </div>
    <div class="textarea-footer">
      <div v-if="errorText && showError" class="error-message">
        {{ errorText }}
      </div>
      <div
        v-if="maxlength"
        class="character-counter"
        :class="{ 'counter-warning': remainingCharacters <= 0 }"
      >
        {{ remainingCharacters }} {{ counterLabel }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  errorText?: string;
  showError?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  maxlength?: number;
  rows?: number;
  counterLabel?: string;
  borderColor?: string;
  borderColorHover?: string;
  borderColorFocus?: string;
  borderRadius?: string;
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  showError: true,
  disabled: false,
  readonly: false,
  rows: 4,
  counterLabel: 'caractères restants',
  borderColor: 'var(--ion-input-border-color)',
  borderColorHover: 'var(--ion-input-border-color-hover)',
  borderColorFocus: 'var(--ion-text-color)',
  borderRadius: 'var(--ion-radius-lg)',
  backgroundColor: 'var(--ion-input-background)',
  textColor: 'var(--ion-text-color)',
  placeholderColor: 'var(--ion-input-placeholder-color)',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  input: [event: Event];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const textareaRef = ref<HTMLTextAreaElement>();
const isFocused = ref(false);
const isHovered = ref(false);

const remainingCharacters = computed(() => {
  if (!props.maxlength) return 0;
  return props.maxlength - (props.modelValue?.length ?? 0);
});

const textareaClasses = computed(() => [
  {
    'em-textarea--focused': isFocused.value,
    'em-textarea--hovered': isHovered.value,
    'em-textarea--error': props.errorText && props.showError,
    'em-textarea--disabled': props.disabled,
  },
]);

const labelClasses = computed(() => [
  {
    'textarea-label--floating':
      isFocused.value || (props.modelValue && props.modelValue.length > 0),
    'textarea-label--error': props.errorText && props.showError,
    'textarea-label--disabled': props.disabled,
  },
]);

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
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

const focusTextarea = () => {
  if (textareaRef.value && !props.disabled) {
    textareaRef.value.focus();
  }
};
</script>

<style scoped>
.em-textarea-wrapper {
  position: relative;
  width: 100%;
}

.textarea-container {
  position: relative;
}

.em-textarea {
  width: 100%;
  background-color: v-bind('props.backgroundColor');
  border-radius: v-bind('props.borderRadius');
  box-sizing: border-box;
  font-family: inherit;
  font-size: 14px;
  border: 1px solid var(--ion-input-border-color);
  padding: 12px 16px;
  transition: all 0.2s ease-in-out;
  outline: none;
  resize: vertical;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.em-textarea::placeholder {
  color: v-bind('props.placeholderColor');
  opacity: 0.8;
}

.em-textarea:hover:not(:disabled):not(.em-textarea--error) {
  border-color: v-bind('props.borderColorHover');
}

.em-textarea:focus:not(.em-textarea--error) {
  border-color: v-bind('props.borderColorFocus');
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.em-textarea.em-textarea--error {
  border-color: #ef4444;
  color: #ef4444;
}

.em-textarea.em-textarea--error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.em-textarea:disabled {
  color: var(--ion-text-color-disabled);
  background-color: var(--ion-input-background-color-disabled);
  border-color: var(--ion-input-border-color-disabled);
  cursor: not-allowed;
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 4px;
  padding: 0 16px;
  gap: 8px;
}

.error-message {
  font-size: 12px;
  color: #ef4444;
  flex: 1;
}

.character-counter {
  font-size: 12px;
  color: var(--ion-text-color-secondary, #6b7280);
  margin-left: auto;
  white-space: nowrap;
}

.character-counter.counter-warning {
  color: #ef4444;
}

.textarea-label {
  position: absolute;
  left: 16px;
  top: 14px;
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

.textarea-label--floating {
  top: 0;
  transform: translateY(-50%);
  font-size: 12px;
  color: v-bind('props.borderColorFocus');
  pointer-events: auto;
}

.textarea-label--error {
  color: #ef4444;
}

.textarea-label--error.textarea-label--floating {
  color: #ef4444;
}

.textarea-label--disabled {
  color: var(--ion-text-color-disabled, #6b7280);
}
</style>
