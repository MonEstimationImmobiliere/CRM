<template>
  <nav class="bottom-menu-mobile">
    <button
      v-for="item in navItems"
      :key="item.path"
      class="bottom-menu-item"
      :class="{ 'is-active': isActive(item.path) }"
      @click="navigate(item.path)"
    >
      <el-icon class="bottom-menu-icon">
        <component :is="item.icon" v-if="item.icon" />
      </el-icon>
      <span class="bottom-menu-label">{{ item.label }}</span>
    </button>

    <!-- User avatar item -->
    <el-popover placement="top" :width="280" trigger="click" popper-class="user-profile-popover">
      <template #reference>
        <button class="bottom-menu-item">
          <el-icon class="bottom-menu-icon" style="color: inherit">
            <Avatar />
          </el-icon>
          <span class="bottom-menu-label">{{ userFirstName }}</span>
        </button>
      </template>

      <div class="user-profile-card">
        <div class="user-profile-header">
          <div class="user-profile-avatar">
            <el-icon :size="28"><Avatar /></el-icon>
          </div>
          <div class="user-profile-info">
            <span class="user-profile-name">{{ user.name }}</span>
            <span class="user-profile-email">{{ user.email }}</span>
          </div>
        </div>

        <div class="user-profile-details">
          <div class="user-detail-row">
            <span class="user-detail-label">Agence</span>
            <span class="user-detail-value">{{ user.code_agence || '—' }}</span>
          </div>
          <div class="user-detail-row">
            <span class="user-detail-label">Rôle</span>
            <span class="user-detail-value user-role-badge">{{ getRoleLabel(user.role) }}</span>
          </div>
        </div>

        <div class="user-profile-footer">
          <el-button type="danger" plain class="logout-btn" @click="logout">
            <el-icon><SwitchButton /></el-icon>
            Se déconnecter
          </el-button>
        </div>
      </div>
    </el-popover>
  </nav>
</template>

<script setup lang="ts">
// ==========================================
// 1. IMPORTS & TYPES
// ==========================================
import { computed, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { Avatar, SwitchButton } from '@element-plus/icons-vue';
import { userStore } from '@/stores/user';
import type { Layout } from 'types/layout';

interface NavItem {
  path: string;
  icon: Component | undefined;
  label: string;
}

// ==========================================
// 3. STATE
// ==========================================
const route = useRoute();
const router = useRouter();
const user = userStore();

const keepAlivePages = inject<Layout.keepAlivePages>('keepAlivePages');

// ==========================================
// 4. COMPUTED
// ==========================================
const visibleRoutes = computed((): RouteRecordRaw[] => {
  return router.options.routes.filter((r: RouteRecordRaw) => {
    if (r.meta?.hidden) return false;
    if (r.name === 'CarrierSelected') return false;
    const visibleChildren =
      r.children?.filter((child: RouteRecordRaw) => !child.meta?.hidden) ?? [];
    return visibleChildren.length > 0;
  });
});

const navItems = computed((): NavItem[] => {
  return visibleRoutes.value.map((r: RouteRecordRaw): NavItem => {
    const visibleChild = r.children?.find((child: RouteRecordRaw) => !child.meta?.hidden);
    return {
      path: r.path,
      icon: visibleChild?.meta?.icon as Component | undefined,
      label: (visibleChild?.meta?.title ?? r.meta?.title ?? '') as string,
    };
  });
});

const userFirstName = computed((): string => {
  return user.name?.split(' ')[0] ?? '';
});

// ==========================================
// 5. FUNCTIONS / METHODS
// ==========================================
function isActive(itemPath: string): boolean {
  if (itemPath === '/') return route.path === '/';
  return route.path === itemPath || route.path.startsWith(itemPath + '/');
}

function navigate(path: string): void {
  router.push(path);
}

function logout(): void {
  user.logout().finally(() => {
    router.replace('/login');
  });
}

function getRoleLabel(role: string | undefined): string {
  const labels: Record<string, string> = {
    admin: 'Administrateur',
    agency_manager: "Responsable d'agence",
    agent: 'Agent',
  };
  return labels[role ?? ''] ?? role ?? '—';
}

// ==========================================
// 6. WATCHERS
// ==========================================
watch(
  () => route.path,
  () => {
    if (route.meta.keepAlive && !keepAlivePages?.has(route.name as string)) {
      keepAlivePages?.add(route.name as string);
    }
  }
);
</script>

<style lang="postcss" scoped>
.bottom-menu-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: row;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60px;
  text-decoration: none;
  color: #86868b;
  transition: color 0.2s;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;

  &.is-active {
    color: #626aef;
  }

  &:hover:not(.is-active) {
    color: #1d1d1f;
  }
}

.bottom-menu-icon {
  font-size: 22px;
  margin-bottom: 3px;
}

.bottom-menu-label {
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
