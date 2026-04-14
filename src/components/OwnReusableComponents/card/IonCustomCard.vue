<template>
  <IonCard class="custom-card" :class="cardClasses" :style="cardStyles">
    <!-- Header Section -->
    <IonCardHeader v-if="hasHeader" class="custom-card-header">
      <div class="header-content">
        <div class="header-left">
          <IonCardTitle v-if="title" class="custom-card-title">
            {{ title }}
          </IonCardTitle>
          <p v-if="subtitle" class="custom-card-subtitle">
            {{ subtitle }}
          </p>
        </div>
        <div v-if="hasHeaderAction" class="header-right">
          <slot name="header-action">
            <IonButton
              v-if="headerButtonText"
              fill="clear"
              size="small"
              @click="$emit('header-action')"
            >
              {{ headerButtonText }}
              <IonIcon v-if="headerButtonIcon" :icon="headerButtonIcon"></IonIcon>
            </IonButton>
          </slot>
        </div>
      </div>

      <!-- Custom header content slot -->
      <slot name="header-custom"></slot>
    </IonCardHeader>

    <!-- Content Section -->
    <IonCardContent class="custom-card-content" :class="contentClasses">
      <!-- Default content slot -->
      <slot></slot>
    </IonCardContent>

    <!-- Footer Section -->
    <div v-if="hasFooter" class="custom-card-footer">
      <slot name="footer"></slot>
    </div>
  </IonCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
} from '@ionic/vue';
import { useDeviceDetection } from '@/common/composables/useDeviceDetection';

// Props
interface Props {
  title?: string;
  subtitle?: string;
  headerButtonText?: string;
  headerButtonIcon?: string;
  variant?: 'default' | 'gradient' | 'compact' | 'stat';
  size?: 'small' | 'medium' | 'large';
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  noPadding?: boolean;
  centerContent?: boolean;
  noShadow?: boolean;
  border?: boolean;
  borderHover?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'medium',
  noPadding: false,
  centerContent: false,
  shadow: true,
  border: true,
  borderHover: true,
});

// Device detection
const { isMobile } = useDeviceDetection();

// Get slots
import { useSlots } from 'vue';
import type { Slots } from 'vue';
const slots: Readonly<Slots> = useSlots();

// Computed
import type { ComputedRef } from 'vue';
const hasHeader: ComputedRef<boolean> = computed(() => {
  return !!(props.title || props.subtitle || hasHeaderAction.value || slots['header-custom']);
});

const hasHeaderAction: ComputedRef<boolean> = computed(() => {
  return !!(props.headerButtonText || props.headerButtonIcon || slots['header-action']);
});

const hasFooter = computed(() => {
  return !!slots.footer;
});

const cardClasses = computed(() => {
  return [
    `card-variant-${props.variant}`,
    `card-size-${props.size}`,
    { 'no-shadow': !props.noShadow },
    { border: props.border },
    { 'no-border-hover': !props.borderHover },
    { 'is-mobile': isMobile.value },
  ];
});

const contentClasses = computed(() => {
  return {
    'no-padding': props.noPadding,
    'center-content': props.centerContent,
  };
});

const cardStyles = computed(() => {
  const styles: Record<string, string> = {};

  // Helper function to normalize values
  const normalizeValue = (value: string | number | undefined) => {
    if (value === undefined) return undefined;
    return typeof value === 'number' ? `${value}px` : value;
  };

  // Apply dimension props
  if (props.width !== undefined) {
    styles.width = normalizeValue(props.width)!;
  }
  if (props.height !== undefined) {
    styles.height = normalizeValue(props.height)!;
  }
  if (props.minWidth !== undefined) {
    styles.minWidth = normalizeValue(props.minWidth)!;
  }
  if (props.minHeight !== undefined) {
    styles.minHeight = normalizeValue(props.minHeight)!;
  }
  if (props.maxWidth !== undefined) {
    styles.maxWidth = normalizeValue(props.maxWidth)!;
  }
  if (props.maxHeight !== undefined) {
    styles.maxHeight = normalizeValue(props.maxHeight)!;
  }

  return styles;
});
</script>

<style scoped>
.custom-card {
  background: var(--ion-background-color);
  border-radius: 30px;
  border: 1px solid var(--ion-border-color);
  box-shadow: var(--ion-box-shadow);
  margin: 0;
  transition: all 0.3s ease;
  overflow: visible !important;
}

/* Force overflow visible on all card elements */
.custom-card :deep(ion-card-content),
.custom-card :deep(.card-content-ios),
.custom-card :deep(.card-content-md) {
  overflow: visible !important;
}

.custom-card.is-mobile {
  width: 20rem;
}

.custom-card:hover {
  box-shadow: var(--ion-box-shadow-hover);
  border: 1px solid var(--ion-input-border-color-hover);
}

/* Card Variants */
.card-variant-gradient {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  color: var(--ion-color-light);
}

.card-variant-gradient .custom-card-title {
  color: var(--ion-color-primary);
}

.card-variant-gradient .custom-card-subtitle {
  color: rgba(255, 255, 255, 0.9);
}

.card-variant-compact {
  box-shadow: var(--ion-box-shadow);
}

/* Shadow Control */
.no-shadow {
  box-shadow: none !important;
}

.no-shadow:hover {
  box-shadow: none !important;
}

/* Border Control */
.border {
  border: 1px solid var(--ion-input-border-color) !important;
}

.border:hover {
  border: 1px solid var(--ion-input-border-color-hover) !important;
}

/* Border Hover Control */
.no-border-hover:hover {
  border: 1px solid var(--ion-input-border-color) !important;
}

/* Card Sizes */
.card-size-small .custom-card-content {
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
}

.card-size-large .custom-card-content {
  --padding-start: 24px;
  --padding-end: 24px;
  --padding-top: 24px;
  --padding-bottom: 24px;
}

/* Header */
.custom-card-header {
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 20px;
  --padding-bottom: 12px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.custom-card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color);
  margin-bottom: 4px;
  text-transform: uppercase;
}

.custom-card-subtitle {
  color: var(--ion-text-color-secondary);
  font-size: 14px;
  margin-bottom: 0;
  margin-top: 8px;
  line-height: 1.4;
}

.header-right {
  flex-shrink: 0;
}

/* Content */
.custom-card-content {
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 12px;
  --padding-bottom: 20px;
  overflow: visible;
}

.custom-card-content.no-padding {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.custom-card-content.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Footer */
.custom-card-footer {
  padding: 12px 20px 20px;
  border-top: 1px solid var(--ion-border-color);
  background: var(--ion-background-color-secondary);
  border-radius: 0 0 12px 12px;
}
</style>
