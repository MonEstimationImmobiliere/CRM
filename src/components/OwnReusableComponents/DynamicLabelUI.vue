<template>
  <div class="dynamic-label-wrapper" :class="{ disabled: isDisabled }">
    <label :class="{ active: isFocused || modelValue }" :style="labelStyle">
      {{ text }}
    </label>
    <div @focusin="!isDisabled && (isFocused = true)" @focusout="!isDisabled && (isFocused = false)">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  text: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "#909399", // Default label color
  },
  activeColor: {
    type: String,
    default: "#409EFF", // Default active/floating label color
  },
  disabled: {
    type: Boolean,
    default: false, // Disable behavior when true
  },
});

const isFocused = ref(false);

const labelStyle = computed(() => {
  if (props.disabled) {
    return {
      color: "#ccc", // Change label color when disabled
      backgroundColor: "#f5f7fa", // Set the background color when disabled
    };
  }

  return {
    color: isFocused.value || props.modelValue ? props.activeColor : props.color,
  };
});

const isDisabled = computed(() => props.disabled);
</script>

<style scoped>
.dynamic-label-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.dynamic-label-wrapper label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  transition: 0.2s ease all;
  pointer-events: none;
  background: white;
  padding: 0 4px;
  font-size: 14px;
  z-index: 1;
}

.dynamic-label-wrapper label.active {
  top: -8px;
  left: 8px;
  font-size: 12px;
  z-index: 1;
}

.dynamic-label-wrapper.disabled label {
  pointer-events: none; /* Disable interaction with label */
}

.dynamic-label-wrapper.disabled label.active {
  top: 50%; /* Keep label in place if disabled */
  left: 12px;
  font-size: 14px;
}

.dynamic-label-wrapper.disabled div {
  background-color: #f5f7fa; /* Disabled background color for the input */
}
</style>
