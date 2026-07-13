<script setup lang="ts">
import { inject } from 'vue';
import { Fold } from '@element-plus/icons-vue';
import type { Layout } from 'types/layout';
import { ElIcon } from 'element-plus';
import useDeviceBreakpoints from '@/composables/isMobile';

const { isMobile } = useDeviceBreakpoints();
const sidebarRelated = inject<Layout.SidebarRelated>('sidebarRelated');
</script>

<template>
  <header v-if="isMobile" class="header-mobile">
    <div class="header-mobile-inner">
      <span class="accent-dot" />
      <h1 class="app-title-mobile">
        <span class="title-mon">mon</span><span class="title-estimation">estimation</span
        ><span class="title-immo">immo</span>
      </h1>
      <span class="accent-line" />
    </div>
  </header>
  <header v-else>
    <section>
      <ElIcon
        :class="['icon-sidebar-trigger', sidebarRelated?.collapsed && 'collapsed']"
        @click="sidebarRelated && (sidebarRelated.collapsed = !sidebarRelated.collapsed)"
      >
        <Fold />
      </ElIcon>
      <BreadCrumb :withIcons="true"></BreadCrumb>
    </section>
  </header>
</template>

<style scoped>
header {
  display: flex;
  padding-top: 10px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
}

header section:first-of-type {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  flex-shrink: 0;
  overflow: hidden;
  flex: 1;
}

header section:last-of-type {
  display: inline-flex;
  flex-wrap: nowrap;
  flex-shrink: 0;
  align-items: center;
}
.header-mobile {
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 16px;
  width: 100vw;
  display: flex;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-mobile-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.accent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.45);
}

.accent-line {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(168, 85, 247, 0.4);
}

.app-title-mobile {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  white-space: nowrap;
  line-height: 1;
}

.title-mon {
  color: #94a3b8;
  font-weight: 500;
}

.title-estimation {
  color: #1e293b;
  font-weight: 700;
}

.title-immo {
  color: #3b82f6;
  font-weight: 700;
}

.icon-sidebar-trigger {
  cursor: pointer;
  margin-right: 1.2rem;
  font-size: 1.6rem;
}

.icon-sidebar-trigger.collapsed {
  transform: rotate(180deg);
}
</style>
