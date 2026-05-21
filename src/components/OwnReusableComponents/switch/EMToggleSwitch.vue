<template>
  <label class="em-toggle-switch" :class="{ disabled: disabled, checked: modelValue }">
    <span v-if="label && labelPosition === 'left'" class="toggle-label label-left">
      {{ label }}
    </span>

    <div class="toggle-track">
      <input
        type="checkbox"
        class="toggle-input"
        :checked="modelValue"
        :disabled="disabled"
        @change="handleChange"
      />
      <span class="toggle-slider"></span>
    </div>

    <span v-if="label && labelPosition === 'right'" class="toggle-label label-right">
      {{ label }}
    </span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  labelPosition: 'left',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
}>();

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
  emit('change', target.checked);
};
</script>

<style scoped>
.em-toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.em-toggle-switch.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color, #333);
}

.toggle-track {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 1;
  margin: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--ion-background-color-step-200, #ccc);
  border-radius: 24px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  left: 2px;
  bottom: 2px;
  width: 20px;
  height: 20px;
  background-color: #fff;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--ion-color-primary-slider, #3880ff);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-input:focus + .toggle-slider {
  box-shadow: 0 0 0 2px rgba(56, 128, 255, 0.3);
}

.toggle-input:disabled + .toggle-slider {
  cursor: not-allowed;
}

/* Hover effect */
.em-toggle-switch:not(.disabled):hover .toggle-slider::before {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
</style>
