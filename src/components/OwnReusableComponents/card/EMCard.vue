<template>
  <div class="em-card" :class="[cardClasses]" :style="cardStyles">
    <div v-if="hasHeader" class="em-card-header">
      <div class="header-content">
        <div class="header-left">
          <slot name="header-left">
            <h3
              v-if="title"
              class="em-card-title"
              :class="[
                `title-size-${titleSize}`,
                { 'no-uppercase': !titleUppercase },
              ]"
              :style="{ '--title-font-size': titleSizeMap[titleSize] }"
            >
              {{ title }}
            </h3>
            <p
              v-if="subtitle"
              class="em-card-subtitle"
              :style="{ '--title-font-size': titleSizeMap[titleSize] }"
            >
              {{ subtitle }}
            </p>
          </slot>
        </div>
        <div class="header-right">
          <slot name="header-actions" />
          <el-button
            v-if="navButtonLabel"
            @click="$emit('navigate')"
            class="nav-button"
          >
            {{ navButtonLabel }}
          </el-button>
        </div>
      </div>
      <slot name="header-custom" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="em-card-state loading-state">
      <div v-if="showSpinner" class="loading-spinner">⏳</div>
      <p v-if="loadingText">{{ loadingText }}</p>
      <slot name="loading" />
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="em-card-state empty-state">
      <div v-if="emptyIcon" class="empty-icon">📭</div>
      <p v-if="emptyText">{{ emptyText }}</p>
      <slot name="empty" />
    </div>

    <!-- Content Section -->
    <div
      v-else
      class="em-card-content"
      :class="contentClasses"
      :style="contentStyles"
    >
      <slot />
    </div>

    <!-- Footer Section -->
    <div v-if="$slots.footer" class="em-card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { ElButton } from 'element-plus';

interface Props {
  title?: string;
  subtitle?: string;
  titleUppercase?: boolean;
  titleSize?: 'XS' | 'S' | 'M' | 'L';
  variant?: 'default' | 'gradient' | 'compact';
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
  // HomepageCard props
  loading?: boolean;
  loadingText?: string;
  showSpinner?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  emptyIcon?: string;
  isActionButton?: boolean;
  navButtonLabel?: string;
  fullHeight?: boolean;
  scrollable?: boolean;
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'medium',
  titleUppercase: true,
  titleSize: 'XS',
  noPadding: false,
  centerContent: false,
  noShadow: true,
  border: true,
  borderHover: true,
});

const titleSizeMap: Record<string, string> = {
  XS: '14px',
  S: '20px',
  M: '24px',
  L: '32px',
};

const slots = useSlots();

const hasHeader = computed(() => {
  return !!(
    props.title ||
    props.subtitle ||
    props.navButtonLabel ||
    slots['header-action'] ||
    slots['header-actions'] ||
    slots['header-left'] ||
    slots['header-custom']
  );
});

const cardClasses = computed(() => [
  `card-variant-${props.variant}`,
  `card-size-${props.size}`,
  {
    'no-shadow': props.noShadow,
    'with-border': props.border,
    'border-hover': props.borderHover,
    'full-height': props.fullHeight,
    'has-header': hasHeader.value,
  },
]);

const contentClasses = computed(() => ({
  'no-padding': props.noPadding,
  'center-content': props.centerContent,
  scrollable: props.scrollable,
}));

const contentStyles = computed(() => {
  const styles: Record<string, string> = {};
  if (props.justifyContent) {
    styles['justify-content'] = props.justifyContent;
    styles['display'] = 'flex';
    styles['flex-direction'] = 'column';
  }
  return styles;
});

const cardStyles = computed(() => {
  const styles: Record<string, string> = {};

  const normalizeValue = (value: string | number | undefined) => {
    if (value === undefined) return undefined;
    return typeof value === 'number' ? `${value}px` : value;
  };

  if (props.width !== undefined) styles.width = normalizeValue(props.width)!;
  if (props.height !== undefined) styles.height = normalizeValue(props.height)!;
  if (props.minWidth !== undefined)
    styles.minWidth = normalizeValue(props.minWidth)!;
  if (props.minHeight !== undefined)
    styles.minHeight = normalizeValue(props.minHeight)!;
  if (props.maxWidth !== undefined)
    styles.maxWidth = normalizeValue(props.maxWidth)!;
  if (props.maxHeight !== undefined)
    styles.maxHeight = normalizeValue(props.maxHeight)!;

  return styles;
});
</script>

<style scoped>
.em-card {
  background: var(--ion-background-color);
  border-radius: var(--ion-radius-lg);
  margin: 0;
  padding: var(--ion-padding-card);
  transition: all var(--ion-duration-300) var(--ion-ease-in-out);
  position: relative;
  display: flex;
  flex-direction: column;
}

.em-card.dark-theme {
  background: linear-gradient(135deg, #09090a 0%, #2d2d2d 100%);
}

.em-card.full-height {
  height: 100%;
}

/* Border */
.em-card.with-border {
  border: var(--ion-border-1) solid var(--ion-input-border-color);
}

.em-card.with-border.border-hover:hover {
  border-color: var(--ion-input-border-color-hover, #999);
}

/* Border only on hover (when border is false but border-hover is true) */
.em-card:not(.with-border).border-hover {
  border: var(--ion-border-1) solid transparent;
}

.em-card:not(.with-border).border-hover:hover {
  border: var(--ion-border-1) solid var(--ion-input-border-color-hover);
}

/* Shadow */
.em-card:not(.no-shadow) {
  box-shadow: var(--ion-box-shadow);
}

.em-card:not(.no-shadow):hover {
  box-shadow: var(--ion-box-shadow-hover);
}

.em-card.no-shadow {
  box-shadow: none;
}

/* Variants */
.em-card.card-variant-gradient {
  background: linear-gradient(
    135deg,
    var(--ion-color-tertiary) 0%,
    var(--ion-color-secondary-shade) 100%
  );
  border: none;
}

.em-card.card-variant-compact {
  box-shadow: var(--ion-box-shadow);
}

.em-card.card-variant-outlined {
  background-color: transparent;
}

/* Header */
.em-card-header {
  flex-shrink: 0;
  margin-bottom: var(--ion-space-3);
  overflow: visible;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ion-space-4);
}

.header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--ion-space-2);
}

.em-card-title {
  font-weight: 400;
  color: var(--ion-text-color);
  margin: 0 0 var(--ion-space-1) 0;
  /* text-transform: uppercase; */
}

.em-card-title.title-size-XS {
  font-size: var(--ion-text-sm);
}

.em-card-title.title-size-S {
  font-size: var(--ion-text-lg);
}

.em-card-title.title-size-M {
  font-size: var(--ion-text-xl);
}

.em-card-title.title-size-L {
  font-size: var(--ion-text-4xl);
}

.em-card-title.no-uppercase {
  text-transform: none;
}

.em-card-subtitle {
  color: var(--ion-text-color-secondary);
  font-size: calc(var(--title-font-size, var(--ion-text-sm)) - 6px);
  margin: 0;
  line-height: var(--ion-leading-snug);
}

.nav-button {
  display: flex;
  align-items: center;
  gap: var(--ion-gap-sm);
}

/* States */
.em-card-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--ion-text-color-secondary);
  padding: var(--ion-space-8) var(--ion-space-4);
}

.loading-state .loading-spinner {
  font-size: var(--ion-text-3xl);
  margin-bottom: var(--ion-space-4);
}

.empty-state .empty-icon {
  font-size: var(--ion-text-4xl);
  color: var(--ion-icon-color-primary);
  opacity: var(--ion-opacity-50);
  margin-bottom: var(--ion-space-3);
}

.em-card-state p {
  margin: 0;
  font-size: var(--ion-text-base);
}

/* Content */
.em-card-content {
  flex: 1;
  min-height: 0;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.em-card-content.no-padding {
  margin: calc(-1 * var(--ion-padding-card));
}

.em-card-content.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.em-card-content.scrollable {
  overflow-y: auto;
  scrollbar-width: none;
}

.em-card-content.scrollable::-webkit-scrollbar {
  display: none;
}

/* Sizes */
.em-card.card-size-small .em-card-content {
  padding: var(--ion-space-3);
}

.em-card.card-size-large .em-card-content {
  padding: var(--ion-space-6);
}

/* Footer */
.em-card-footer {
  padding-top: var(--ion-space-5);
  border-radius: 0 0 var(--ion-radius-3xl) var(--ion-radius-3xl);
}

/* Responsive */
@media (max-width: 1450px) {
  .em-card-header h2 {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 1250px) {
  .em-card-header h2 {
    display: none;
  }
}
</style>
