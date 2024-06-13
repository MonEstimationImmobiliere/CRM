<template>
  <SbCardZone :disabled="props.disabled" class="sb-add-zone" @click="handleClick">
    <div class="d-flex flex-center gap-10">
      <SbIcon icon-path="Element:Plus" icon-size="1.2em" />
      <slot />
    </div>
  </SbCardZone>
</template>

<script lang="ts" setup>
import SbCardZone from "../SbCardZone/SbCardZone.vue";
import SbIcon from "../SbIcon/SbIcon.vue";

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const handleClick = (event): void => {
  if (!props.disabled) {
    emit("click", event);
  }
};

</script>

<style lang="scss" scoped>
.sb-add-zone {

  border-color: var(--el-color-primary);
  border-radius: 8px;
  border-style: dashed;
  border-width: 2px;
  color: var(--el-color-primary);
  font-size: 1.1em;
}
</style>
