<template>
  <div class="sb-menu">
    <div class="sb-menu-logo-wrapper">
      <SbLink @click="handleHomeClick">
        <img class="menu-logo" :src="displayedLogoURL" alt="logo">
      </SbLink>
    </div>
    <ElMenu>
      <slot />
    </ElMenu>
    <template v-if="$slots['after-menu']">
      <div class="sb-menu-after-menu-wrapper">
        <slot name="after-menu" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useCssVar, useMediaQuery } from "@vueuse/core";
import { ElMenu } from "element-plus";
import { computed } from "vue";

import logoFull from "@confero/common/assets/logo-full.png?url";
import logoFullAlternate from "@confero/common/assets/logo-full-alternate1.png?url";
import logoMinimal from "@confero/common/assets/logo-minimal.png?url";
import logoMinimalAlternate from "@confero/common/assets/logo-minimal-alternate1.png?url";
import { useIsMobileDevice } from "@confero/common/hooks/useIsMobileDevice";

import SbLink from "../SbLink/SbLink.vue";

const props = defineProps<{
  alternatesLogo?: boolean;
}>();

const emit = defineEmits<{
  (event: "home-click"): void; // <-- Emit when open animation start (optional)
}>();

const sbMdMaxWidth = useCssVar("--sb-md-max-width");
const shouldDisplayMinimalLogo = useMediaQuery(`(max-width: ${sbMdMaxWidth.value})`);
const isMobileDevice = useIsMobileDevice();

const displayedLogoURL = computed((): string => {
  if (isMobileDevice.value || !shouldDisplayMinimalLogo.value) {
    return props.alternatesLogo ? logoFullAlternate : logoFull;
  }
  else {
    return props.alternatesLogo ? logoMinimalAlternate : logoMinimal;
  }
});

const handleHomeClick = (): void => {
  emit("home-click");
};

</script>

<style scoped lang="scss">
.sb-menu {
  --sb-menu-padding: #{$sb-main-padding};
  background-color: var(--el-color-white);
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-block: var(--sb-menu-padding);

  .sb-menu-logo-wrapper {
    display: block;

    &:not(:empty) {
      align-items: center;
      display: flex;
      justify-content: start;
      margin-bottom: var(--sb-menu-padding);
      padding-bottom: var(--sb-gap-y);
      padding-left: var(--el-menu-base-level-padding);
      padding-top: var(--sb-gap-y);
      position: relative;

      .menu-logo {
        max-height: 25px;
        max-width: 100%;
      }

    }

  }

  .sb-menu-after-menu-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--sb-gap-y);
    padding-inline: calc(var(--sb-gap-x) * 1.5);
  }

  .el-menu {
    --el-menu-text-color: var(--el-text-color-primary);
    --el-menu-active-color: var(--el-menu-text-color);
    --el-menu-hover-bg-color: transparent;
    border: unset;
    display: flex;
    flex: 1;
    flex-direction: column;
    margin-top: calc(var(--sb-gap-y) * 2);
  }
}

@media screen and (max-width: $sb-md-max-width) and (min-width: $sb-sm-max-width) {
  .sb-menu {
    .sb-menu-logo-wrapper {
      &:not(:empty) {
        justify-content: center;
        padding-left: unset;
        padding-right: unset;

        .menu-logo {
          max-height: 50px;
        }
      }
    }
  }
}

@media screen and (max-width: $sb-xs-max-width) {
  .sb-menu-after-menu-wrapper {
    bottom: calc(var(--sb-gap-x)*2);
    position: absolute;
  }
}

</style>

