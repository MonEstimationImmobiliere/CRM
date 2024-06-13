<script setup lang="ts">
import { inject } from 'vue'
import { Fold } from '@element-plus/icons-vue'
import type { Layout } from 'types/layout'
import { ElIcon } from 'element-plus'

const sidebarRelated = inject<Layout.SidebarRelated>('sidebarRelated')


</script>

<template>
  <header>
    <section>
      <ElIcon :class="['icon-sidebar-trigger', sidebarRelated?.collapsed && 'collapsed']"
        @click="sidebarRelated && (sidebarRelated.collapsed = !sidebarRelated.collapsed)">
        <Fold />
      </ElIcon>    
        <BreadCrumb :withIcons="true"></BreadCrumb>
    </section>
  </header>
</template>

<style scoped lang="postcss">
header {
  height: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;

  & section {
    &:first-of-type {
      display: inline-flex;
      flex-wrap: nowrap;
      align-items: center;
      flex-shrink: 0;
      overflow: hidden;
      flex: 1
    }

    &:last-of-type {
      display: inline-flex;
      flex-wrap: nowrap;
      flex-shrink: 0;
      align-items: center;
    }
  }
}

.icon-sidebar-trigger {
  cursor: pointer;
  margin-right: 1.2rem;
  font-size: 1.2rem;

  &.collapsed {
    transform: rotate(180deg);
  }
}
</style>