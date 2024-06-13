<template>
  <ElRadioGroup
    class="sb-radio-group"
    :class="{'is-radio-button': props.radioButton}"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElRadioGroup>
</template>

<script setup lang="ts">
import { ElRadioGroup } from "element-plus";

const props = withDefaults(
  defineProps<{
    radioButton?: boolean;
  }>(), {
    radioButton: false
  }
);

</script>

<style scoped lang="scss">
.sb-radio-group {
  align-items: initial;
  display: flex;
  flex-wrap: wrap;
  font-size: inherit;
  gap: 0 var(--sb-gap-x);
  line-height: inherit;
  width: 100%;

  &.is-radio-button {
    gap: 0;
  }
}
</style>
