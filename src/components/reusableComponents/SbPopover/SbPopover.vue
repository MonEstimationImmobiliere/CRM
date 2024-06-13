<template>
  <ElPopover ref="elPopoverRef" :popper-class="popperClass">
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElPopover>
</template>

<script lang="ts" setup>
import { ElPopover } from "element-plus";
import { computed, shallowRef } from "vue";

const props = defineProps<{
  popperClass?: string;
  noPadding?: boolean;
}>();

const elPopoverRef = shallowRef<InstanceType<typeof ElPopover>>();

const popperClass = computed((): string => `${props.popperClass ?? ""} ${props.noPadding ? "no-padding" : ""} sb-popover`);
const popperEl = computed((): HTMLElement | undefined => elPopoverRef.value?.popperRef?.contentRef);

defineExpose({
  popperEl
});
</script>

<style lang="scss">
.sb-popover.el-popper {
  --el-popover-border-radius: var(--el-border-radius-base);
  --el-popover-padding: var(--sb-gap-y) var(--sb-gap-x);
  max-width: 1250px;
  width: auto !important;
  word-break: initial;

  .el-popover__title {
    font-weight: 600;
  }

  &.no-padding {
    padding: 0;
  }
}
</style>
