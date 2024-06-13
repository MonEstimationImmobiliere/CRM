<template>
  <SbDialog
    ref="dialogRef"
    class="sb-actions-dialog"
    :title="props.title ?? t('common.moreOptions')"
    :subtitle="props.subtitle"
    :show-close="props.showClose"
    :close-on-press-escape="props.showClose"
    :close-on-click-modal="props.showClose"
    :style="style"
    align-center
  >
    <template v-if="props.message">
      <SbTypography as="h6" class="text-center mb-4">
        {{ props.message }}
      </SbTypography>
    </template>
    <div class="actions">
      <template v-for="action, index in props.actions" :key="action.id">
        <template v-if="index > 0 && action.divider">
          <ElDivider class="action-divider" />
        </template>
        <SbButton
          class="action"
          :type="action.type"
          :loading="action.loading?.value"
          :disabled="action.disabled"
          @click="handleActionClick($event, action)"
        >
          {{ action.title }}
        </SbButton>
      </template>
    </div>
    <template v-if="props.afterMessage">
      <template v-if="props.dangerouslyUseHTMLString">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="text-center" v-html=" props.afterMessage " />
      </template>
      <template v-else>
        <div class="text-center">
          {{ props.afterMessage }}
        </div>
      </template>
    </template>
  </SbDialog>
</template>

<script lang="ts" setup>
import { ElDivider } from "element-plus";
import { computed, shallowRef } from "vue";
import { useI18n } from "vue-i18n";

import type { ISbActionsDialogAction } from "@confero/common/types/common";

import SbButton from "../SbButton/SbButton.vue";
import SbDialog from "../SbDialog/SbDialog.vue";
import SbTypography from "../SbTypography/SbTypography.vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    message?: string;
    afterMessage?: string;
    actions?: ISbActionsDialogAction[];
    payload?: unknown;
    dangerouslyUseHTMLString?: boolean;
    width?: number;
    showClose?: boolean;
  }>(), {
    title: undefined,
    subtitle: undefined,
    message: undefined,
    afterMessage: undefined,
    actions: (): ISbActionsDialogAction[] => [],
    payload: undefined,
    dangerouslyUseHTMLString: false,
    width: 350,
    showClose: true
  }
);

const emit = defineEmits<{
  (e: "action", data: { event: Event; action: ISbActionsDialogAction; payload: unknown }): void;
}>();

const { t } = useI18n();

const dialogRef = shallowRef<InstanceType<typeof SbDialog>>();

const style = computed((): Record<string, string> => {
  return {
    "--sb-dialog-width": `${props.width}px`
  };
});

const handleActionClick = (event: Event, action: ISbActionsDialogAction): void => {
  return emit("action", {
    event,
    action,
    payload: props.payload
  });
};

</script>

<style lang="scss">
.sb-actions-dialog {
  .actions {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: calc(var(--sb-gap-y) / 2) calc(var(--sb-gap-x) / 2);
    justify-content: center;

    .action-divider {
      margin: calc(var(--sb-gap-y) / 2) 0;
    }

    .action {
      margin: 0;
      width: 100%;
    }
  }
}
</style>
