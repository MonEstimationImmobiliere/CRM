<template>
  <button
    class="custom-button"
    :class="{
      'button-primary': props.type === BUTTON_TYPE.PRIMARY,
      'button-secondary': props.type === BUTTON_TYPE.SECONDARY,
      'button-primary-gradient': props.type === BUTTON_TYPE.PRIMARY_GRADIENT,
      'button-disabled': props.disabled || props.loading,
      'button-round': props.shape === BUTTON_SHAPE.ROUND,
      'button-circle': props.shape === BUTTON_SHAPE.CIRCLE,
    }"
    :style="buttonStyles"
    v-bind="$attrs"
    :disabled="props.disabled || props.loading"
  >
    <span v-if="loading" class="button-spinner">
      <IonSpinner name="crescent" />
    </span>

    <!-- Icon en position start -->
    <span
      v-if="!loading && icon && iconPosition === 'start'"
      class="button-icon"
    >
      <ElIcon
        :key="icon"
        :name="icon"
        :size="iconSize"
        :color="computedIconColor"
        :cssColor="computedIconCssColor"
      />
    </span>

    <span v-if="$slots.start" class="button-start">
      <slot name="start"></slot>
    </span>

    <span class="button-content">
      <slot></slot>
    </span>

    <span v-if="$slots.end" class="button-end">
      <slot name="end"></slot>
    </span>

    <!-- Icon en position end -->
    <span v-if="!loading && icon && iconPosition === 'end'" class="button-icon">
      <ElIcon
        :key="icon"
        :name="icon"
        :size="iconSize"
        :color="computedIconColor"
        :cssColor="computedIconCssColor"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  type ButtonType,
  type ButtonShape,
  BUTTON_TYPE,
  BUTTON_SHAPE,
} from '@/constants';
import { ElIcon } from 'element-plus';

interface Props {
  width?: string;
  height?: string;
  border?: string;
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: ButtonType;
  shape?: ButtonShape;
  // Icon props
  icon?: string;
  iconPosition?: 'start' | 'end';
  iconSize?: string;
  iconColor?: string; // Couleurs Ionic: 'primary', 'secondary', etc.
  iconCssColor?: string; // Variables CSS ou couleurs custom
  textColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: 'auto',
  height: '44px',
  backgroundColor: 'var(--ion-background-color)',
  borderRadius: '30px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.0)',
  border: 'solid 1px var(--ion-input-border-color)',
  type: undefined,
  iconPosition: 'start',
  iconSize: 'small',
});

// Couleur de l'icône basée sur le type de bouton
const computedIconColor = computed(() => {
  if (props.iconColor) return props.iconColor;

  // Si le bouton est primary/secondary/gradient, l'icône doit être en couleur contrastée
  if (
    props.type === BUTTON_TYPE.PRIMARY ||
    props.type === BUTTON_TYPE.SECONDARY ||
    props.type === BUTTON_TYPE.PRIMARY_GRADIENT
  ) {
    return undefined; // Laisse cssColor gérer ou utilise le style CSS
  }

  return undefined;
});

// Couleur CSS de l'icône basée sur le type de bouton
const computedIconCssColor = computed(() => {
  if (props.iconCssColor) return props.iconCssColor;

  if (
    props.type === BUTTON_TYPE.PRIMARY ||
    props.type === BUTTON_TYPE.SECONDARY ||
    props.type === BUTTON_TYPE.PRIMARY_GRADIENT
  ) {
    return 'var(--ion-text-color-contrast)';
  }

  // Pour standard et autres types, utilise la couleur du texte normale
  return 'var(--ion-text-color)';
});

const buttonStyles = computed(() => ({
  '--button-width': props.width || 'auto',
  '--button-height': props.height || '44px',
  '--button-bg-color': props.backgroundColor,
  '--button-box-shadow': props.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.0)',
  '--button-border-radius': props.borderRadius || '3vmin',
  '--button-border': props.border || 'solid 1px var(--ion-input-border-color)',
  ...(props.textColor ? { '--button-text-color': props.textColor } : {}),
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
  padding: 8px 20px;
  box-shadow: var(--button-box-shadow);
}

.custom-button:hover {
  border: solid 1px var(--ion-input-border-color-hover);
}

.custom-button:active {
  opacity: 0.8;
}

.button-icon,
.button-start,
.button-end {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.button-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--button-text-color, var(--ion-text-color));
}

.button-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-spinner ion-spinner {
  width: 20px;
  height: 20px;
  color: inherit;
}

.button-primary {
  background-color: var(--ion-color-primary);
  color: var(--ion-text-color-contrast);
  border: none;
  font-weight: 500;
}

.button-primary-gradient {
  background: linear-gradient(
    18deg,
    var(--ion-color-primary),
    var(--ion-color-primary-shade)
  );
  border: none;
  font-weight: 500;
}

.button-primary-gradient .button-content {
  color: var(--button-text-color, var(--ion-text-color-contrast));
}

.button-primary .button-content {
  color: var(--button-text-color, var(--ion-text-color-contrast));
}

.button-primary:hover {
  background-color: var(--ion-color-primary-shade);
  border: none;
}

.button-secondary {
  background-color: var(--ion-color-secondary);
  border: none;
}

.button-secondary .button-content {
  color: var(--button-text-color, var(--ion-text-color-contrast));
}

.button-secondary:hover {
  background-color: var(--ion-color-secondary-shade);
  border: none;
}

.button-disabled {
  background-color: var(--ion-color-medium);
  border: none;
  cursor: not-allowed;
}

.button-disabled:hover {
  background-color: var(--ion-color-medium);
  border: none;
}

/* Shape variants */
.button-round {
  border-radius: 50%;
  aspect-ratio: 1;
  padding: 8px;
  width: var(--button-height);
  min-width: var(--button-height);
  justify-content: center;
}

.button-round .button-content {
  flex: 0;
  font-size: 0;
  line-height: 0;
}

.button-circle {
  border-radius: 50%;
  aspect-ratio: 1;
  padding: 12px;
  width: var(--button-height);
  min-width: var(--button-height);
  justify-content: center;
}

.button-circle .button-content {
  flex: 0;
  font-size: 0;
  line-height: 0;
}
</style>
