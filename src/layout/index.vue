<script setup lang="ts">
import { computed } from 'vue';
import { onBeforeMount, provide, reactive, ref } from 'vue';
import HeadBar from './HeadBar.vue';
import SideBar from './SideBar.vue';
import BottomMenuMobile from './BottomMenuMobile.vue';
// import TabsBar from './TabsBar.vue';
import isMobile from '@/composables/isMobile';
import MinimalistHouse from '@/assets/minimalist-original-icon-house-curvy.svg';

import type { Layout } from 'types/layout';

const { isMobile: _isMobile, isCompact } = isMobile();
const sidebarRelated = reactive<Layout.SidebarRelated>({
  collapsed: true,
  width: '13rem',
  collapsedWidth: '4rem',
});
const loading = reactive<Layout.Loading>({
  logout: false,
});
const keepAlivePages = ref<Layout.keepAlivePages>(new Set());
// const getKeepAlivePages = computed(() => {
//   return Array.from(keepAlivePages.value);
// });
const asideWidth = computed(() => {
  return sidebarRelated?.collapsed ? sidebarRelated?.collapsedWidth : sidebarRelated?.width;
});

onBeforeMount(() => {
  setSidebarCollapsed();
});

function setSidebarCollapsed() {
  sidebarRelated.collapsed = isCompact.value;
}

// provide layout-related state information for the child components
provide('sidebarRelated', sidebarRelated);
provide('keepAlivePages', keepAlivePages.value);
provide('loading', loading);
</script>
<template>
  <ElContainer style="height: 100%">
    <ElAside v-if="!isCompact" :width="asideWidth">
      <div
        class="shadow-lg"
        style="display: flex; flex-direction: column; width: 100%; height: 100%"
      >
        <RouterLink to="/">
          <el-image
            :style="{
              width: '100%',
              height: sidebarRelated.collapsed ? '3rem' : '6rem',
              padding: '0.3rem 0',
              position: 'sticky',
              top: '0',
              zIndex: '100',
            }"
            :src="MinimalistHouse"
            fit="contain"
          />
        </RouterLink>
        <SideBar></SideBar>
      </div>
    </ElAside>
    <ElContainer>
      <ElHeader
        :class="{ 'el-header--mobile': _isMobile }"
        :style="!_isMobile ? '' : ''"
      >
        <HeadBar></HeadBar>
        <!-- <TabsBar :withIcons="true"></TabsBar> -->
      </ElHeader>
      <ElMain
        id="content-window"
        :class="{ 'content-mobile': _isMobile, 'content-with-bottom-menu': isCompact }"
      >
        <Transition name="slide-left" mode="out-in">
          <RouterView />
        </Transition>
      </ElMain>
    </ElContainer>
  </ElContainer>
  <Teleport to="body">
    <Transition name="slide-right" mode="out-in" appear>
      <Shadow
        v-if="isCompact && !_isMobile && !sidebarRelated.collapsed"
        @shadowClick="sidebarRelated.collapsed = true"
      >
        <div class="block sidebar-mobile">
          <RouterLink to="/">
            <el-image
              :style="{
                width: sidebarRelated.width,
                height: sidebarRelated.collapsed ? '3.6rem' : '6.6rem',
                padding: '0.3rem 0',
              }"
              :src="MinimalistHouse"
              fit="contain"
            />
          </RouterLink>
          <SideBar style="padding-right: 1rem"></SideBar>
        </div>
      </Shadow>
    </Transition>
  </Teleport>
  <BottomMenuMobile v-if="isCompact" />
</template>

<style lang="postcss" scoped>
.sidebar-mobile {
  width: v-bind('sidebarRelated.width');
  height: 96vh;
  position: absolute;
  top: 2vh;
  left: 2vw;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.shadow-lg {
  background-color: #fff;
}

:deep(.content-mobile) {
  padding: 8px 12px;
  padding-top: calc(48px + 8px);
}

:deep(.content-with-bottom-menu) {
  padding-bottom: calc(60px + env(safe-area-inset-bottom));
}

:deep(.el-header--mobile) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: auto !important;
  padding: 0 !important;
  background: #ffffff;
}
</style>
