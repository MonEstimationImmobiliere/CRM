<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<template>
  <div class="searchable-select">
    <!-- Search input -->
    <div class="search-container">
      <!-- Floating label -->
      <label v-if="label" :class="floatingLabelClasses" class="floating-label" @click="focusInput">
        {{ label }}
      </label>

      <input
        ref="inputRef"
        v-model="searchText"
        @input="handleSearch(searchText)"
        @focus="handleFocus"
        @blur="handleBlur"
        :disabled="disabled"
        :placeholder="hasFloatingLabel ? '' : placeholder"
        class="search-input"
        :class="{
          'has-chips': hasSelectedItems && props.showChip,
          'search-input--with-floating-label': hasFloatingLabel,
        }"
        :style="{
          minHeight: props.minimumHeight,
          borderRadius: props.borderRadius,
        }"
      />

      <!-- Loader -->
      <div v-if="loading" class="loader-container" aria-label="Loading">
        <div class="spinner"></div>
      </div>

      <!-- Clear button -->
      <button
        v-if="searchText && !disabled && !loading"
        @click="clearSearch"
        class="clear-button"
        type="button"
        aria-label="Clear search"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </button>

      <!-- Selected items as chips inside input -->
      <div
        v-if="hasSelectedItems && props.showChip"
        class="input-chips"
        :class="{ 'chips-disabled': disabled }"
      >
        <!-- Multiple selection chips -->
        <CustomChip
          v-if="multiple"
          v-for="item in selectedItems"
          :key="item.value"
          :label="item.label"
          size="small"
          :removable="!disabled"
          @remove="removeItem(item.value)"
          class="input-chip"
        />

        <!-- Single selection chip -->
        <CustomChip
          v-else-if="selectedValue"
          :label="getSelectedLabel()"
          size="small"
          :removable="!disabled"
          @remove="clearSelection"
          class="input-chip"
        />
      </div>

      <!-- Selected items as text value (when showChip is false) -->
      <div v-if="hasSelectedItems && !props.showChip" class="input-value-display">
        <span v-if="multiple" class="selected-count">
          {{ selectedItems.length }} élément(s) sélectionné(s)
        </span>
      </div>
    </div>

    <!-- Dropdown with filtered options -->
    <ul v-if="showDropdown && filteredOptions.length > 0" class="options-dropdown">
      <li
        v-for="option in filteredOptions"
        :key="option.value"
        @click="selectOption(option)"
        :class="{ 'option-disabled': isOptionSelected(option.value) }"
        class="option-item"
      >
        <div class="option-content">
          <h3 class="option-title">{{ option.label }}</h3>
          <p v-if="option.subtitle" class="option-subtitle">
            {{ option.subtitle }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import CustomChip from '../chip/CustomChip.vue';

// Types
interface Option {
  label: string;
  value: any;
  subtitle?: string;
}

interface Props {
  options: Option[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  multiple?: boolean;
  debounce?: number;
  searchFunction?: (query: string) => Promise<Option[]>;
  modelValue?: any;
  selectedItems?: Option[];
  showChip?: boolean;
  loading?: boolean;
  minimumHeight?: string;
  borderRadius?: string;
}

interface Emits {
  (e: 'update:modelValue', value: any): void;
  (e: 'update:selectedItems', items: Option[]): void;
  (e: 'search', query: string): void;
  (e: 'select', option: Option): void;
  (e: 'remove', value: any): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'blur', event: FocusEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Rechercher...',
  label: '',
  disabled: false,
  multiple: false,
  debounce: 300,
  selectedItems: () => [],
  showChip: false,
  loading: false,
  minimumHeight: 'auto',
  borderRadius: 'var(--ion-radius-lg)',
});

const emit = defineEmits<Emits>();

// Reactive state
const searchText = ref('');
const showDropdown = ref(false);
const internalOptions = ref<Option[]>([]);
const isUserTyping = ref(false);
const isFocused = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

// Computed
const filteredOptions = computed(() => {
  if (props.searchFunction) {
    return internalOptions.value;
  }

  if (!searchText.value) {
    return props.options.slice(0, 10);
  }

  return props.options
    .filter(
      (option) =>
        option.label.toLowerCase().includes(searchText.value.toLowerCase()) ||
        (option.subtitle && option.subtitle.toLowerCase().includes(searchText.value.toLowerCase()))
    )
    .slice(0, 10);
});

const selectedValue = computed(() => props.modelValue);
const selectedItems = computed(() => props.selectedItems);

// Check if we have selected items
const hasSelectedItems = computed(() => {
  if (props.multiple) {
    return selectedItems.value.length > 0;
  }
  return selectedValue.value !== null && selectedValue.value !== undefined;
});

// Check if label should float
const hasFloatingLabel = computed(() => !!props.label);

const isLabelFloating = computed(() => {
  return (
    isFocused.value ||
    hasSelectedItems.value ||
    !!(searchText.value && searchText.value.length > 0) ||
    showDropdown.value
  );
});

const floatingLabelClasses = computed(() => ({
  'floating-label--active': isLabelFloating.value,
  'floating-label--disabled': props.disabled,
}));

// Methods
const handleSearch = async (value: string) => {
  isUserTyping.value = true;
  searchText.value = value;
  showDropdown.value = value.length > 0;

  emit('search', value);

  if (props.searchFunction) {
    try {
      internalOptions.value = await props.searchFunction(value);
    } catch (error) {
      console.error('Error in search function:', error);
      internalOptions.value = [];
    }
  }
};

const clearSearch = () => {
  isUserTyping.value = true;
  searchText.value = '';
  showDropdown.value = false;
  emit('search', '');
};

const selectOption = (option: Option) => {
  emit('select', option);
  isUserTyping.value = false;

  if (props.multiple) {
    const newItems = [...selectedItems.value, option];
    emit('update:selectedItems', newItems);
    searchText.value = '';
  } else {
    emit('update:modelValue', option.value);
    searchText.value = option.subtitle ? `${option.label} (${option.subtitle})` : option.label;
  }

  showDropdown.value = false;
};

const removeItem = (value: any) => {
  if (props.disabled) return;

  emit('remove', value);

  if (props.multiple) {
    const newItems = selectedItems.value.filter((item) => item.value !== value);
    emit('update:selectedItems', newItems);
  }
};

const clearSelection = () => {
  if (props.disabled) return;

  isUserTyping.value = false;
  emit('update:modelValue', null);
  searchText.value = '';
};

const isOptionSelected = (value: any): boolean => {
  if (props.multiple) {
    return selectedItems.value.some((item) => item.value === value);
  }
  return selectedValue.value === value;
};

const getSelectedLabel = (): string => {
  if (props.multiple) return '';

  // First try to find the option in the provided options
  let option = props.options.find((opt) => opt.value === selectedValue.value);

  // If not found and we have internal options (from search), try there
  if (!option && internalOptions.value.length > 0) {
    option = internalOptions.value.find((opt) => opt.value === selectedValue.value);
  }

  if (!option) return '';

  return option.subtitle ? `${option.label} (${option.subtitle})` : option.label;
};

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  emit('blur', event);
};

const focusInput = () => {
  if (inputRef.value && !props.disabled) {
    inputRef.value.focus();
  }
};

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    // Only update searchText if user is not currently typing
    if (!isUserTyping.value) {
      if (!props.multiple && newValue) {
        // Find the option in options, internalOptions, or selectedItems
        let option = props.options.find((opt) => opt.value === newValue);
        if (!option && internalOptions.value.length > 0) {
          option = internalOptions.value.find((opt) => opt.value === newValue);
        }
        // Check in selectedItems as well for pre-selected values
        if (!option && props.selectedItems && props.selectedItems.length > 0) {
          option = props.selectedItems.find((opt) => opt.value === newValue);
        }
        if (option) {
          searchText.value = option.subtitle
            ? `${option.label} (${option.subtitle})`
            : option.label;
        }
      } else if (!props.multiple && !newValue) {
        searchText.value = '';
      }
    }
  },
  { immediate: true }
);

// Watch for selectedItems changes
watch(
  () => props.selectedItems,
  (newSelectedItems) => {
    // Only update searchText if user is not currently typing
    if (
      !isUserTyping.value &&
      !props.multiple &&
      props.modelValue &&
      newSelectedItems &&
      newSelectedItems.length > 0
    ) {
      const option = newSelectedItems.find((opt) => opt.value === props.modelValue);
      if (option) {
        searchText.value = option.subtitle ? `${option.label} (${option.subtitle})` : option.label;
      }
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.searchable-select {
  position: relative;
}

/* Search input styling */
.search-input {
  width: 100%;
  background: var(--ion-input-background);
  border: 1px solid var(--ion-input-border-color);
  border-radius: var(--ion-radius-lg);
  padding: 0 16px;
  font-size: 14px;
  color: var(--ion-text-color);
  transition: all 0.3s ease;
  outline: none;
  min-height: 40px;
}

.search-input:hover {
  border-color: var(--ion-input-border-color-hover);
}

.search-input::placeholder {
  color: var(--ion-text-color-secondary);
}

.search-input:focus {
  border-color: var(--ion-input-border-color-focus);
}

.search-input:disabled {
  background: var(--ion-input-background-color-disabled);
  border-color: var(--ion-input-border-color-disabled);
  color: var(--ion-text-color-disabled);
  cursor: not-allowed;
}

/* Search container styling */
.search-container {
  position: relative;
}

/* Clear button */
.clear-button {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  color: var(--ion-text-color-secondary);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-button:hover {
  background: var(--ion-background-color-hover-secondary);
  color: var(--ion-text-color);
}

.clear-button svg {
  width: 20px;
  height: 20px;
}

/* Loader styling */
.loader-container {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Input with chips styling */
.has-chips {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  min-height: auto !important;
}

/* Chips inside input */
.input-chips {
  position: absolute;
  top: 8px;
  left: 12px;
  right: 50px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  pointer-events: auto;
  z-index: 10;
}

.chips-disabled .input-chip {
  opacity: 0.6;
  pointer-events: none;
}

/* Input value display (when chips are disabled) */
.input-value-display {
  position: absolute;
  top: 50%;
  left: 16px;
  right: 50px;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
}

.selected-count,
.selected-value-text {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Hide input text when showing chips/values */
.has-chips {
  color: transparent;
}

/* Dropdown styling */
.options-dropdown {
  position: relative;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  border: 1px solid var(--ion-input-border-color);
  border-radius: 16px;
  max-height: 400px;
  overflow-y: auto;
  background: var(--ion-background-color);
  box-shadow: var(--ion-box-shadow);
  z-index: 1000;
  animation: dropdownSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  list-style: none;
  padding: 0;
  margin: 0;
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.option-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--ion-input-border-color);
}

.option-item:last-child {
  border-bottom: none;
}

.option-item:hover {
  background: var(--ion-input-background-hover-secondary);
}

.option-item.option-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--ion-input-background-color-disabled);
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color);
}

.option-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--ion-text-color-secondary);
}

/* Scrollbar styling */
.options-dropdown::-webkit-scrollbar {
  width: 6px;
}

.options-dropdown::-webkit-scrollbar-track {
  background: var(--ion-background-color);
  border-radius: 8px;
}

.options-dropdown::-webkit-scrollbar-thumb {
  background: var(--ion-scrollbar-thumb-color);
  border-radius: 8px;
}

.options-dropdown::-webkit-scrollbar-thumb:hover {
  background: var(--ion-scrollbar-thumb-hover-color);
}

/* Floating label styles */
.floating-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ion-text-color-secondary);
  font-size: 16px;
  pointer-events: none;
  transition: all 0.2s ease-in-out;
  background-color: transparent;
  padding: 0;
  z-index: 2;
  user-select: none;
  cursor: text;
  border-radius: 3px;
}

.floating-label--active {
  top: 0;
  left: 12px;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 500;
  color: var(--ion-text-color);
  background: var(--ion-background-color);
  padding: 0 4px;
  z-index: 0;
}

.floating-label--disabled {
  color: var(--ion-text-color-secondary);
}

.floating-label--disabled.floating-label--active {
  color: var(--ion-text-color-secondary);
}

/* Adjust input padding when using floating label */
.search-input--with-floating-label {
  padding-top: 6px;
  padding-bottom: 6px;
}
</style>
