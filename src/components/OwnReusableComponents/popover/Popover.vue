<!-- eslint-disable prettier/prettier -->
<template>
  <div class="popover-wrapper" ref="wrapperRef">
    <div class="popover-trigger" @click="toggle">
      <slot name="trigger" />
    </div>

    <Transition name="popover-fade">
      <div v-if="isOpen" class="popover-content" :class="`popover--${placement}`">
        <slot />
        <div v-if="showActions" class="popover-actions">
          <Button @click="handleCancel">
            {{ cancelText }}
          </Button>
          <Button type="primary" @click="handleConfirm">
            {{ confirmText }}
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Button from '../button/Button.vue';

interface Props {
  confirmText?: string;
  cancelText?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showActions?: boolean;
}

withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  placement: 'bottom',
  showActions: true,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function handleConfirm() {
  emit('confirm');
  close();
}

function handleCancel() {
  emit('cancel');
  close();
}

function onClickOutside(event: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside, true);
});

defineExpose({ close, toggle });
</script>

<style scoped>
.popover-wrapper {
  position: relative;
  display: inline-flex;
}

.popover-trigger {
  cursor: pointer;
}

.popover-content {
  position: absolute;
  z-index: 100;
  min-width: 200px;
  padding: 16px;
  background: var(--ion-background-color, #fff);
  border: 1px solid var(--ion-border-color, #e0e0e0);
  border-radius: var(--ion-radius-lg, 12px);
  box-shadow: var(--ion-box-shadow-hover);
}

.popover--bottom {
  top: calc(100% + 8px);
  right: 0;
}

.popover--top {
  bottom: calc(100% + 8px);
  right: 0;
}

.popover--left {
  right: calc(100% + 8px);
  top: 0;
}

.popover--right {
  left: calc(100% + 8px);
  top: 0;
}

.popover-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.popover-fade-enter-active,
.popover-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
