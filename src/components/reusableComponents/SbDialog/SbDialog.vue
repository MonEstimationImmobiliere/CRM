<template>
  <ElDialog
    ref="dialogRef"
    top="0"
    destroy-on-close
    append-to-body
    :class="classes"
    :close-on-press-escape="closeOnPressEscape"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
    @update:model-value="handleUpdateModelValue"
    @open="handleDialogOpen"
    @close="handleDialogClose"
  >
    <template #header="{ close }">
      <div class="sb-dialog-header-content text-ellipsis">
        <slot name="header">
          <template v-if="iconPath">
            <slot name="icon">
              <SbIcon
                :icon-path="iconPath"
                :icon-size="iconSize"
                class="sb-dialog-header-icon"
              />
            </slot>
          </template>
          <slot name="title">
            <SbTypography
              as="h5"
              class="text-ellipsis"
            >
              <slot name="title-text">
                {{ title }}
              </slot>
            </SbTypography>
          </slot>
          <slot name="subtitle">
            <template v-if="hasSubtitle">
              <SbTypography
                as="p1"
                class="text-ellipsis"
              >
                <slot name="subtitle-text">
                  {{ subtitle }}
                </slot>
              </SbTypography>
            </template>
          </slot>
        </slot>
      </div>
      <slot name="header-end" />
      <template v-if="showClose">
        <template v-if="!!$slots['header-end']">
          <ElDivider direction="vertical" />
        </template>
        <SbButton
          text
          squared
          icon-path="Element:CloseBold"
          :icon-size="24"
          class="sb-dialog-header-close"
          @click="close"
        />
      </template>
    </template>
    <slot />
    <template #footer>
      <div class="sb-dialog-footer-content">
        <slot name="footer" />
      </div>
    </template>
  </ElDialog>
</template>
<script setup lang="ts">
import { DialogProps, ElDialog, ElDivider, ElLoading } from "element-plus";
import type { LoadingInstance } from "element-plus/es/components/loading/src/loading";
import { computed, ref, shallowRef, useSlots, watch } from "vue";

import { useTypedAttrsInherit } from "@confero/common/hooks/useTypedAttrsInherit";

import SbButton from "../SbButton/SbButton.vue";
import SbIcon from "../SbIcon/SbIcon.vue";
import { IconPath } from "../SbIcon/types";
import SbTypography from "../SbTypography/SbTypography.vue";

type StickyShadow = "header" | "footer";

const props = withDefaults(
  defineProps<{
    title?: string;
    iconPath?: IconPath;
    iconSize?: number;
    subtitle?: string;
    loading?: boolean;
    loadingText?: string;
    fullHeight?: boolean;
    showClose?: boolean;
    stickyShadow?: boolean | StickyShadow;
  }>(), {
    title: undefined,
    iconPath: undefined,
    iconSize: 24,
    subtitle: undefined,
    loading: false,
    loadingText: undefined,
    fullHeight: false,
    showClose: true,
    stickyShadow: true
  }
);

const emit = defineEmits<{
  (e: "open", event: unknown): void;
  (e: "close", event: unknown): void;
  (e: "update:modelValue", state: boolean): void;
}>();

const attrs = useTypedAttrsInherit<DialogProps>();
const slots = useSlots();

const showIntersectedDialogTitle = ref(false);
const showIntersectedDialogSubtitle = ref(false);
const intersectedDialogTitle = ref("");
const intersectedDialogSubtitle = ref("");
const dialogRef = shallowRef();
const loadingInstance = shallowRef<LoadingInstance>();

const elements = {
  dialog: null as HTMLElement | null,
  header: null as HTMLElement | null,
  body: null as HTMLElement | null,
  footer: null as HTMLElement | null
};

const intersectObservers = {
  header: null as IntersectionObserver | null,
  body: null as IntersectionObserver | null,
  footer: null as IntersectionObserver | null
};

const classes = computed((): string => {
  const classes = ["sb-dialog"];

  if (props.loading) classes.push("is-loading");
  if (hasHeader.value) classes.push("has-header");
  if (hasFooter.value) classes.push("has-footer");
  if (hasSubtitle.value) classes.push("has-subtitle");
  if (props.fullHeight) classes.push("full-height");
  if (props.stickyShadow === true || props.stickyShadow === "header") classes.push("sticky-header-shadow");
  if (props.stickyShadow === true || props.stickyShadow === "footer") classes.push("sticky-footer-shadow");
  if (props.showClose) classes.push("show-close");

  return classes.join(" ");
});

const title = computed((): string => showIntersectedDialogTitle.value ? intersectedDialogTitle.value || "" : props.title || "");
const subtitle = computed((): string => showIntersectedDialogSubtitle.value ? intersectedDialogSubtitle.value || "" : props.subtitle || "");
const hasSubtitle = computed((): boolean => !!intersectedDialogSubtitle.value || !!slots.subtitle || !!slots["subtitle-text"] || !!props.subtitle);
const hasHeader = computed((): boolean => !!slots.header || !!slots.title || !!props.title || !!slots["title-text"] || hasSubtitle.value);
const hasFooter = computed((): boolean => !!slots.footer);
const closeOnPressEscape = computed((): boolean => !props.loading && (attrs["close-on-press-escape"] ?? true));
const closeOnClickModal = computed((): boolean => !props.loading && (attrs["close-on-click-modal"] ?? true));

watch((): boolean => props.loading, (): void => updateLoaderState());

const initIntersectObservers = (): void => {
  if (elements.header) intersectObservers.header = observeStickyIntersect(elements.header);
  if (elements.footer) intersectObservers.footer = observeStickyIntersect(elements.footer);
  if (elements.body) intersectObservers.body = new IntersectionObserver(handleBodyObserverIntersect, { rootMargin: "-61px" });
};

const observeStickyIntersect = (el): IntersectionObserver => {
  const observer = new IntersectionObserver(
    (entries): void => {
      entries.forEach((entry): boolean => entry.target.classList.toggle("is-sticky", entry.intersectionRatio < 1));
    },
    { threshold: [1] }
  );

  observer.observe(el);
  return observer;
};

const clearIntersectObservers = (): void => {
  elements.header?.classList.remove("is-sticky");
  elements.footer?.classList.remove("is-sticky");
  intersectObservers.header?.disconnect();
  intersectObservers.footer?.disconnect();
  intersectObservers.body?.disconnect();
  intersectObservers.header = null;
  intersectObservers.footer = null;
  intersectObservers.body = null;
};

const updateLoaderState = (): void => {
  loadingInstance.value?.close();

  if (props.loading && elements.dialog) {
    loadingInstance.value = ElLoading.service({
      target: elements.dialog,
      text: props.loadingText
    });
  }
};

const setAutoTitleWhenElementDisappear = (element: HTMLElement): void => {
  intersectedDialogTitle.value = element.innerText;
  intersectObservers.body?.observe(element);
};

const setAutoSubtitleWhenElementDisappear = (element: HTMLElement): void => {
  intersectedDialogSubtitle.value = element.innerText;
  intersectObservers.body?.observe(element);
};

const scrollToTop = (scrollOptions = {}): void => {
  if (!elements.dialog) return;
  elements.dialog.scrollTo({ top: 0, ...scrollOptions });
};

// const forceClose = () => emit("update:modelValue", false);

const handleBodyObserverIntersect = (entries): void => {
  const isIntersecting = !entries.some((entry): boolean => entry.isIntersecting);
  if (intersectedDialogTitle.value) showIntersectedDialogTitle.value = isIntersecting;
  if (intersectedDialogSubtitle.value) showIntersectedDialogSubtitle.value = isIntersecting;
};

const handleHeaderClick = (): void => scrollToTop({ behavior: "smooth" });

// const handleCloseButtonClick = () => close();

// const close = () => {
//   if (attrs["before-close"]) return attrs["before-close"](forceClose);
//   return forceClose();
// };

const handleDialogOpen = (event: unknown): void => {
  elements.dialog = dialogRef.value.dialogContentRef.$el;
  if (!elements.dialog) return;

  updateLoaderState();

  elements.header = elements.dialog.querySelector(":scope > .el-dialog__header");
  elements.body = elements.dialog.querySelector(":scope > .el-dialog__body");
  elements.footer = elements.dialog.querySelector(":scope > .el-dialog__footer");

  if (elements.header) elements.header.addEventListener("click", handleHeaderClick);

  clearIntersectObservers();
  initIntersectObservers();
  emit("open", event);
};

const handleDialogClose = (event: unknown): void => {
  if (elements.header) elements.header.removeEventListener("click", handleHeaderClick);
  clearIntersectObservers();
  emit("close", event);
};

const handleUpdateModelValue = (value): void => emit("update:modelValue", value);

defineExpose({
  elements,
  // close,
  // forceClose,
  setAutoTitleWhenElementDisappear,
  setAutoSubtitleWhenElementDisappear,
  scrollToTop
});
</script>

<style lang="scss">
.sb-dialog {
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);

  --el-dialog-margin-top: unset;
  --el-dialog-padding-primary: var(--sb-gap-x); // no x and y to allow calc(--el-dialog-padding-primary * 2)
  --el-dialog-border-radius: var(--el-border-radius-base);

  --sb-dialog-bg-color: var(--el-bg-color-page);
  --sb-dialog-vertical-margin: var(--sb-gap-y);
  --sb-dialog-horizontal-margin: auto;
  --sb-dialog-width: 600px;
  --sb-dialog-max-height: auto;
  --sb-dialog-max-width: calc(100vw - calc(var(--sb-gap-x) * 2));
  --sb-dialog-min-height: auto;
  --sb-dialog-header-padding: 0px;
  --sb-dialog-header-height: 0px;
  --sb-dialog-footer-padding: 0px;
  --sb-dialog-footer-height: 0px;
  --sb-dialog-internal-header-height: 0px;
  --sb-dialog-internal-footer-height: 0px;
  --sb-dialog-body-padding: var(--el-dialog-padding-primary);
  --sb-dialog-header-box-shadow: 0 4px 10px -4px rgb(0 0 0 / 20%);
  --sb-dialog-footer-box-shadow: 0 -4px 10px -4px rgb(0 0 0 / 20%);
  --sb-dialog-content-fullscreen-height: calc(100vh - var(--sb-dialog-internal-header-height) - var(--sb-dialog-internal-footer-height) - calc(var(--sb-dialog-body-padding) * 2) - calc(var(--sb-dialog-vertical-margin) * 2));

  --el-dialog-bg-color: var(--sb-dialog-bg-color);

  display: flex;
  flex-direction: column;
  margin: var(--sb-dialog-vertical-margin) var(--sb-dialog-horizontal-margin);
  max-height: var(--sb-dialog-max-height);
  max-width: var(--sb-dialog-max-width);
  min-height: var(--sb-dialog-min-height);
  width: var(--sb-dialog-width);

  &.is-fullscreen {
    --sb-dialog-vertical-margin: var(--sb-gap-y);
    --sb-dialog-horizontal-margin: var(--sb-gap-x);
    --sb-dialog-max-width: auto;
    --sb-dialog-width: auto;
    height: calc(100% - calc(var(--sb-dialog-vertical-margin) * 2));

    &.sticky-header-shadow {
      .el-dialog__header {
        box-shadow: var(--sb-dialog-header-box-shadow);
      }
    }

    &.sticky-footer-shadow {
      .el-dialog__footer {
        box-shadow: var(--sb-dialog-footer-box-shadow);
      }
    }
  }

  .el-dialog__header,
  .el-dialog__footer {
    align-items: center;
    background: var(--el-bg-color-overlay);
    box-shadow: unset;
    display: flex;
    margin: 0;
    overflow: hidden;
    position: sticky;
    transition: box-shadow var(--el-transition-duration-fast) ease-out;
    z-index: var(--sb-header-z-index);

    &.is-sticky {
      border-radius: unset;
    }
  }

  .el-dialog__header {
    border-radius: var(--el-dialog-border-radius) var(--el-dialog-border-radius) 0 0;
    min-height: var(--sb-dialog-internal-header-height);
    padding-bottom: 0;
    padding-inline: var(--sb-dialog-header-padding);
    padding-top: env(safe-area-inset-top);
    top: -1px; // for observer

    .sb-dialog-header-content {
      align-items: center;
      display: flex;
      flex: 1;
    }

    .sb-dialog-header-close {
      margin-left: calc(var(--sb-gap-x) / 2);
    }

    .el-divider + .sb-dialog-header-close {
      margin-left: 0;
    }
  }

  .el-dialog__body {
    background: var(--sb-dialog-bg-color);
    flex: 1;
    padding: var(--sb-dialog-body-padding);
    word-break: initial;
  }

  .el-dialog__footer {
    border-radius: 0 0 var(--el-dialog-border-radius) var(--el-dialog-border-radius);
    bottom: -1px; // for observer
    height: var(--sb-dialog-internal-footer-height);
    max-height: var(--sb-dialog-internal-footer-height);
    min-height: var(--sb-dialog-internal-footer-height);
    padding: var(--sb-dialog-footer-padding);

    .sb-dialog-footer-content {
      align-items: center;
      display: flex;
      flex: 1;
      justify-content: flex-end;

      .el-button + .el-button {
        margin-left: calc(var(--sb-gap-x) / 2);
      }
    }
  }

  &.has-header {
    --sb-dialog-header-padding: var(--sb-gap-x);
    --sb-dialog-header-height: 60px;
    --sb-dialog-internal-header-height: calc(var(--sb-dialog-header-height) + 1px);
  }

  &.has-footer {
    --sb-dialog-footer-padding: 10px var(--sb-gap-x) calc(10px + var(--safe-area-inset-bottom)) var(--sb-gap-x);
    --sb-dialog-footer-height: calc(60px + var(--safe-area-inset-bottom));
    --sb-dialog-internal-footer-height: calc(var(--sb-dialog-footer-height) + 1px);
  }

  &.show-close {
    .el-dialog__header {
      padding-right: calc(var(--sb-gap-x) / 2);
    }
  }

  &.full-height {
    --sb-dialog-min-height: calc(100% - (var(--sb-dialog-vertical-margin) * 2));
  }

  &.sticky-header-shadow {
    .el-dialog__header {
      &.is-sticky {
        box-shadow: var(--sb-dialog-header-box-shadow);
      }
    }
  }

  &.sticky-footer-shadow {
    .el-dialog__footer {
      &.is-sticky {
        box-shadow: var(--sb-dialog-footer-box-shadow);
      }
    }
  }

  &.is-loading {
    --sb-dialog-max-height: calc(100% - (var(--sb-dialog-vertical-margin) * 2));
    overflow: hidden;
  }
}

.sb-dialog-header-icon {
  margin-right: calc(var(--sb-gap-x) / 2);
}

@media screen and (max-width: $sb-sm-max-width) {
  .sb-dialog {
    --sb-dialog-width: 80%;
  }
}

@media screen and (max-width: $sb-xs-max-width) {
  .sb-dialog {
    --el-dialog-border-radius: 0;
    --el-dialog-box-shadow: none;
    --sb-dialog-width: 100vw !important;
    --sb-dialog-vertical-margin: 0 !important;
    --sb-dialog-horizontal-margin: 0 !important;
    --sb-dialog-max-width: 100vw !important;
    --sb-dialog-min-height: 100%;

    /**
      * /!\ important !!!
      * set viewport height to 100% for ios layout with keyboard opened
      * do not use --viewport-height
      */
    // height: 100% !important;
    // min-height: 100% !important;

    // &.el-dialog__body {
    //   min-height: 100% !important;
    //   overflow: auto;
    // }

    // &.has-header {
    //   .el-dialog__body {
    //     min-height: calc(100% - var(--sb-dialog-internal-header-height)) !important;
    //   }
    // }

    // &.has-footer {
    //   .el-dialog__body {
    //     min-height: calc(100% - var(--sb-dialog-internal-footer-height)) !important;
    //   }
    // }

    // &.has-header.has-footer {
    //   .el-dialog__body {
    //     min-height: calc(100% - var(--sb-dialog-internal-header-height) - var(--sb-dialog-internal-footer-height)) !important;
    //   }
    // }
  }
}
</style>

