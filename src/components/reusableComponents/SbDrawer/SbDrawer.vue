<template>
  <ElDrawer
    ref="drawer"
    :class="classes"
    v-bind="$attrs"
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="sb-drawer-close-button">
        <SbHeaderButton class="el-icon--left" @click="close">
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
      <h4 :id="titleId" :class="titleClass">
        {{ props.header }}
      </h4>
    </template>
    <template #header-end>
      <slot name="header-end" />
    </template>
    <template #default>
      <div v-loading="props.loading" class="sb-drawer-content">
        <slot />
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ElDrawer } from "element-plus";
import { computed, ref, useSlots } from "vue";

// import { useIsMobileDevice } from "@confero/common/hooks/useIsMobileDevice";

import SbHeaderButton from "../SbHeaderButton/SbHeaderButton.vue";
import SbIcon from "../SbIcon/SbIcon.vue";

const props = withDefaults(
  defineProps<{
    header?: string;
    size?: string;
    loading?: boolean;
  }>(), {
    header: "",
    size: "500px",
    loading: false
  }
);

const drawer = ref<InstanceType<typeof ElDrawer>>();

const isMobileDevice = useIsMobileDevice();

const slots = useSlots();

const classes = computed((): Record<string, boolean> => ({
  "sb-drawer": true,
  "has-header": !!slots.header || !!props.header
}));

// expose handleClose method to close drawer
const handleClose = (): void => {
  drawer.value?.handleClose();
};

defineExpose({
  handleClose
});

</script>

<style lang="scss">
.el-drawer.sb-drawer {
  .el-drawer__header {
    padding-top: calc(env(safe-area-inset-top) + var(--el-drawer-padding-primary));
  }

  .sb-drawer-content {
    height: 100%;
    padding-bottom: calc(env(safe-area-inset-bottom) + var(--el-drawer-padding-primary));
  }
}
</style>
