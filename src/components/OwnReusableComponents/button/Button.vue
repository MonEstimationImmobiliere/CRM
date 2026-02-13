<template>
  <button
    class="custom-button"
    :class="{
      'button-primary': props.type === 'primary',
      'button-secondary': props.type === 'secondary',
      'button-primary-gradient': props.type === 'primary-gradient',
    }"
    :style="buttonStyles"
    v-bind="$attrs"
    :disabled="props.disabled"
  >
    <span v-if="$slots.start" class="button-start">
      <slot name="start"></slot>
    </span>

    <span class="button-content">
      <slot></slot>
    </span>

    <span v-if="$slots.end" class="button-end">
      <slot name="end"></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  width?: string;
  height?: string;
  border?: string;
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'primary-gradient' | 'submit';
}

const props = withDefaults(defineProps<Props>(), {
  width: 'auto',
  height: '44px',
  backgroundColor: 'var(--ion-input-background)',
  borderRadius: '30px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.0)',
  border: 'solid 1px var(--ion-input-border-color)',
  type: undefined,
});

const buttonStyles = computed(() => ({
  '--button-width': props.width || 'auto',
  '--button-height': props.height || '44px',
  '--button-bg-color': props.backgroundColor,
  '--button-box-shadow': props.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.0)',
  '--button-border-radius': props.borderRadius || '3vmin',
  '--button-border': props.border || 'solid 1px var(--ion-input-border-color)',
}));
</script>

<style scoped>
.custom-button {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 8px;
  width: var(--button-width);
  height: var(--button-height);
  background-color: var(--button-bg-color);
  border: var(--button-border);
  border-radius: var(--button-border-radius);
  cursor: pointer;
  transition: opacity 0.2s ease;
  padding: 8px 16px;
  box-shadow: var(--button-box-shadow);
}

.custom-button:hover {
  border: solid 1px var(--ion-input-border-color-hover);
}

.custom-button:active {
  opacity: 0.8;
}

.button-start,
.button-end {
  display: flex;
  align-items: center;
}

.button-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ion-text-color);
}

.button-primary {
  background-color: var(--ion-color-primary);
}

.button-primary-gradient {
  background: linear-gradient(
    18deg,
    var(--ion-color-primary),
    var(--ion-color-primary)
  );
}

.button-primary-gradient .button-content {
  color: var(--ion-text-color-contrast);
}

.button-primary .button-content {
  color: var(--ion-text-color-contrast);
}

.button-primary:hover {
  background-color: var(--ion-color-secondary);
  border: none;
}

.button-secondary {
  background-color: var(--ion-color-secondary);
}

.button-secondary .button-content {
  color: var(--ion-text-color-contrast);
}

.button-secondary:hover {
  background-color: var(--ion-color-secondary);
  border: none;
}
</style>
