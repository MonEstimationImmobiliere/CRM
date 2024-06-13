<template>
  <div
    ref="pageRef"
    v-loading.fullscreen="props.isLoading"
    class="sb-page"
    :class="{
      'has-header': props.header,
      'has-tabs': !!props.tabs?.length,
      'has-fill': props.fill,
      'has-virtual-scroll': props.usedWithVirtualScroll
    }"
  >
    <template v-if="props.header">
      <div class="sb-page-header" :class="{ sticky: props.stickyHeader }">
        <div class="sb-page-header-content">
          <template v-if="$slots.header">
            <slot name="header" />
          </template>
          <template v-else>
            <SbTypography as="h3" semi-bold>
              {{ props.title }}
            </SbTypography>
          </template>
        </div>

        <template v-if="props.tabs">
          <div class="sb-page-header-tabs">
            <ElTabs :model-value="computedActiveTab" @tab-change="handleTabChange">
              <template v-for="tab in tabs" :key="tab.name">
                <ElTabPane :label="tab.label" :name="tab.name" />
              </template>
            </ElTabs>
          </div>
        </template>
      </div>
    </template>

    <slot />
  </div>
</template>

<script lang="ts" setup>
import { ElTabPane, ElTabs, TabPaneName } from "element-plus";
import { computed, shallowRef } from "vue";

import { SbTypography } from "@/components/index";

export interface ISbPageTab {
  label: string;
  name: string;
}

const props = withDefaults(defineProps<{
  header?: boolean;
  fill?: boolean;
  title?: string;
  stickyHeader?: boolean;
  tabs?: ISbPageTab[];
  activeTabName?: TabPaneName;
  usedWithVirtualScroll?: boolean;
  isLoading?: boolean;
}>(), {
  header: true,
  title: "",
  fill: false,
  stickyHeader: false,
  tabs: undefined,
  activeTabName: undefined,
  usedWithVirtualScroll: false
});

const emit = defineEmits<{
  (e: "update:activeTabName", tab: TabPaneName): void;
}>();

const pageRef = shallowRef<HTMLElement>();

const computedActiveTab = computed<TabPaneName>((): TabPaneName => {
  if (props.activeTabName) return props.activeTabName;
  return props.tabs?.[0]?.name ?? "";
});

const handleTabChange = (tabPaneName: TabPaneName): void => {
  emit("update:activeTabName", tabPaneName);
};

if (computedActiveTab.value && !props.activeTabName) {
  emit("update:activeTabName", computedActiveTab.value);
}

</script>

<style lang="scss" scoped>
.sb-page {
  //--sb-page-header-content-height: 55px;
  --sb-page-header-tabs-height: 40px;

  --sb-page-header-computed-height: 0;
  // use this variable to calculate the top position of sticky element in the page
  --sb-page-sticky-top: calc(var(--sb-page-header-computed-height) + var(--sb-layout-sticky-top-offset));

  display: flex;
  flex: 1;
  flex-direction: column;
  //gap: var(--sb-gap-y);
 //padding: var(--sb-gap-y) 0;
  width: 100%;

  &.has-header {
    --sb-page-header-computed-height: auto;

  /* &:not(.has-tabs) {
      .sb-page-header.sticky {
        border-bottom: 1px solid var(--el-border-color-light);

        font-size: 50px;
      }
    }*/

   /* .sb-page-header.sticky {
      position: sticky;
      top: var(--sb-layout-sticky-top-offset);
      z-index: calc(var(--sb-header-z-index) - 1);
    }*/
    
    /*.sb-page-header.sticky {
      //position: sticky;
       top: var(--sb-layout-sticky-top-offset);
      //top: -15px;
       z-index: calc(var(--sb-header-z-index) - 1);
      //z-index: 2;
      background-color: white;

     
    }*/

    
  }

  /*&.has-tabs {
    --sb-page-header-computed-height: calc(var(--sb-page-header-content-height) + var(--sb-page-header-tabs-height));
  }*/

  /*&.has-virtual-scroll {
    height: 100%;
    padding-bottom: 0;
  }*/

  .sb-page-header {
    // background-color: var(--el-bg-color-page);
    height: var(--sb-page-header-computed-height);

    .sb-page-header-content {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: var(--sb-gap-y);
      justify-content: space-between;
      min-height: var(--sb-page-header-content-height);
      padding-bottom: var(--sb-gap-y);
      padding-left: 0;
      padding-right: 0;
      padding-top: var(--sb-gap-y);

      &::before,
      &::after {
        // background: var(--el-bg-color-page);
        content: '';
        height: var(--sb-page-header-computed-height);
        position: absolute;
        top: 0;
        width: 10px;
        z-index: -1;
      }

     /* &::before {
        left: -10px;
      }*/

      &::after {
        right: -10px;
      }
    }

    .sb-page-header-tabs {
      height: var(--sb-page-header-tabs-height);
    }
  }
}



.has-fill {
  max-width: 100%;
}

</style>
