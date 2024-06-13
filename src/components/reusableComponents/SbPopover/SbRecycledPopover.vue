<template>
  <SbPopover
    ref="sbPopoverRef"
    v-model:visible="isPopoverVisible"
    :virtual-ref="popoverVirtualRef"
    virtual-triggering
    :hide-after="-1"
    :auto-close="-1"
    @before-enter="handlePopoverBeforeEnter"
    @after-enter="handlePopoverAfterEnter"
    @before-leave="handlePopoverBeforeLeave"
    @after-leave="handlePopoverAfterLeave"
  >
    <slot :data="data" :is-popover-visible="!isPopoverClosed" :close="close" />
  </SbPopover>
</template>

<script lang="ts" setup>
import { nextTick, ref, shallowRef } from "vue";

import SbPopover from "./SbPopover.vue";

const emit = defineEmits<{
  (e: "before-enter", data: unknown);
  (e: "after-enter", data: unknown);
  (e: "before-leave", data: unknown);
  (e: "after-leave", data: unknown);
}>();

let autoCloseTimeout: number;

const data = ref();
const isPopoverVisible = ref<boolean>(false);
const sbPopoverRef = shallowRef<InstanceType<typeof SbPopover>>();
const popoverVirtualRef = ref();
const isPopoverClosed = ref<boolean>(false);
const openClosePromise = ref<Promise<void>>(Promise.resolve());
const openClosePromiseResolve = ref<() => void>();

const cancelAutoClose = (): void => {
  window.clearTimeout(autoCloseTimeout);
};

const startAutoClose = (): void => {
  cancelAutoClose();
  autoCloseTimeout = window.setTimeout((): void => {
    close();
  }, 500);
};

const open = async (options: { data?: unknown; reference: unknown }): Promise<void> => {
  await close();

  data.value = options.data;
  popoverVirtualRef.value = options.reference;
  isPopoverVisible.value = true;
  isPopoverClosed.value = false;

  await nextTick();
  return openClosePromise.value;
};

const close = async (): Promise<void> => {
  cancelAutoClose();
  isPopoverVisible.value = false;

  await nextTick();
  await openClosePromise.value;
};

const closeByMouseLeave = (): void => {
  startAutoClose();
};

const toggle = async (options): Promise<void> => {
  return isPopoverVisible.value ? close() : open(options);
};

const handlePopoverBeforeEnter = (): void => {
  openClosePromise.value = new Promise((resolve): void => { openClosePromiseResolve.value = resolve; });

  isPopoverClosed.value = false;
  sbPopoverRef.value?.popperEl?.removeEventListener("mouseenter", handlePopperMouseEnter);
  emit("before-enter", data.value);
};

const handlePopoverAfterEnter = (): void => {
  sbPopoverRef.value?.popperEl?.addEventListener("mouseenter", handlePopperMouseEnter);
  openClosePromiseResolve.value?.();
  emit("after-enter", data.value);
};

const handlePopoverBeforeLeave = (): void => {
  openClosePromise.value = new Promise((resolve): void => { openClosePromiseResolve.value = resolve; });

  emit("before-leave", data.value);
};
const handlePopoverAfterLeave = (): void => {
  isPopoverClosed.value = true;
  openClosePromiseResolve.value?.();
  emit("after-leave", data.value);
};

const handlePopperMouseEnter = (): void => {
  cancelAutoClose();
};

defineExpose({
  open,
  close,
  closeByMouseLeave,
  toggle,
  isPopoverVisible
});
</script>
