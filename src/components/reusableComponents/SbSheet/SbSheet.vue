<template>
  <div class="sb-sheet">
    <div class="sb-sheet-overlay" @click="handleCloseSheetClick" />
    <Transition
      appear
      name="vertical-slide"
      @before-enter="handleBeforeEnterTransition"
      @after-enter="handleAfterEnterTransition"
      @leave="handleLeaveTransition"
      @after-leave="handleAfterLeaveTransition"
    >
      <div
        v-show="props.modelValue"
        v-loading="loading"
        class="sb-sheet-card-wrapper"
        v-bind="$attrs"
      >
        <div class="sb-sheet-inner">
          <SbCard class="sb-sheet-card " :border="false" :shadow="false">
            <template #header>
              <div class="sb-sheet-header">
                <div class="sb-sheet-button-container">
                  <SbHeaderButton class="sb-sheet-close-button" @click="handleCloseSheetButtonClick">
                    <template #icon>
                      <template v-if="$slots['icon']">
                        <slot name="icon" />
                      </template>
                      <template v-else>
                        <SbIcon icon-path="Element:CloseBold" :icon-size="18" />
                      </template>
                    </template>
                  </SbHeaderButton>
                </div>
                <div class="sb-sheet-header-title">
                  <slot name="header-title">
                    {{ props.title }}
                  </slot>
                </div>
                <div class="sb-sheet-button-container">
                  <slot name="header-end" />
                </div>
              </div>
            </template>

            <slot />
          </SbCard>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>

import type { InternalDisclosable } from "@confero/common/types/disclose";

import SbCard from "../SbCard/SbCard.vue";
import SbHeaderButton from "../SbHeaderButton/SbHeaderButton.vue";
import SbIcon from "../SbIcon/SbIcon.vue";

const props = withDefaults(defineProps<{
  modelValue: boolean;
  title?: string;
  disclosable?: InternalDisclosable;
  loading?: boolean;
}>(), {
  disclosable: undefined,
  modelValue: false,
  title: undefined
});

const emit = defineEmits<{
  (event: "open"): void;
  (event: "opened"): void;
  (event: "close"): void;
  (event: "closed"): void;
  (event: "update:modelValue", value: boolean): void;
}>();

const handleCloseSheetButtonClick = (): void => {
  props.disclosable?.close();
};

const handleCloseSheetClick = (event: MouseEvent): void => {
  if (event.target === event.currentTarget) {
    handleCloseSheetButtonClick();
  }
};

const handleBeforeEnterTransition = (): void => {
  // disable scrolling on the body
  document.body.style.overflow = "hidden";
  emit("open");
};
const handleAfterEnterTransition = (): void => emit("opened");
const handleLeaveTransition = (): void => emit("close");
const handleAfterLeaveTransition = (): void => {
  // enable scrolling on the body
  document.body.style.overflow = "";
  emit("closed");
};

</script>

<style lang="scss" scoped>

.sb-sheet {
  --sb-sheet-body-padding: var(--sb-gap-x);
  will-change: height;

  .sb-sheet-overlay {
    background-color: rgba(0, 0, 0, 0.5);
    bottom: 0;
    left: 0;
    overflow: auto;
    position: fixed;
    right: 0;
    top: 0;
    z-index: calc(var(--sb-header-z-index) + 1);
  }

  .vertical-slide-enter-active {
    animation: vertical-slide 0.15s ease;
    overflow: hidden;
  }

  .vertical-slide-leave-active {
    animation: vertical-slide 0.15s ease reverse;
    overflow: hidden;
  }

  @keyframes vertical-slide {
    0% {
      height: 0;
    }

    100% {
      max-height: 100%;
    }
  }

  .sb-sheet-card-wrapper {
    --sb-sheet-z-index: calc(var(--sb-header-z-index) + 1);
    --sb-sheet-button-width: 40px;
    --sb-border-radius: calc(var(--el-border-radius-base) * 3) calc(var(--el-border-radius-base) * 3) 0 0;
    border-radius: var(--sb-border-radius);
    border-bottom-right-radius: 0;
    bottom: 0;
    box-shadow: var(--el-box-shadow-dark);
    height: calc(var(--sb-sheet-height) - env(safe-area-inset-top, 0));
    position: fixed;
    width: var(--sb-sheet-width);
    z-index: var(--sb-sheet-z-index);

    ::v-deep(.el-loading-mask) {
      border-radius: var(--sb-border-radius);

    }

    :deep(.el-card__header) {
      border-bottom: 1px solid var(--el-border-color-extra-light);
      z-index: var(--sb-sheet-z-index);
    }

    .sb-sheet-header {
      align-items: center;
      display: flex;
      gap: var(--sb-gap-x);
      justify-content: space-between;

      .sb-sheet-header-title {
        font-weight: bold;
        text-align: center;
      }
    }

    .sb-sheet-button-container {
      display: flex;
      justify-content: center;
      min-width: var(--sb-sheet-button-width);

      .dropdown-menu-button {
        align-items: center;
        aspect-ratio: 1;
        background-color: #f0f0f0d0;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        justify-content: center;
        margin: auto;
        width: var(--sb-sheet-button-width);
      }
    }

    .sb-sheet-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: flex-end;
      width: 100%;
    }

    .sb-sheet-card {
      --el-card-bg-color: var(--el-color-info-light-9);
      height: 100%;
      transform: translateZ(0);
      width: 100%;

      > :deep(.el-card__body) {
        overflow-x: hidden;
        overflow-y: auto;
        padding: var(--sb-sheet-body-padding);
      }
    }

    .sb-sheet-card {
      border-radius: var(--sb-border-radius);
    }

  }

  .sb-sheet-card-wrapper {
    --sb-sheet-height: 95vh;
    --sb-sheet-width: 400px;
    right: var(--sb-gap-x);
  }

}

@media screen and (max-width: $sb-xs-max-width) {
  .sb-sheet {
    .sb-sheet-card-wrapper {
      --sb-border-radius: 0;
      --sb-sheet-height: 100%;
      --sb-sheet-width: 100%;
      left: 0;
      right: 0;
    }
  }
}
</style>
