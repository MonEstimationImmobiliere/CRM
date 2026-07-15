<template>
  <Scrollbar :speed="3">
    <ElMenu
      class="menu-vertical"
      mode="vertical"
      :collapse="sidebarRelated?.collapsed"
      :defaultActive="defaultActive"
      :defaultOpeneds="defaultOpeneds"
      :collapseTransition="false"
    >
      <template v-for="route in routesList" key="index">
        <MenuItemNav :route="route" :basePath="route.path"> </MenuItemNav>
      </template>
    </ElMenu>
  </Scrollbar>
  <div class="SideBar-logout-container">
    <el-popover placement="top" :width="280" trigger="click" popper-class="user-profile-popover">
      <template #reference>
        <div class="sidebar-user-trigger">
          <el-icon class="user-avatar-icon"><Avatar /></el-icon>
          <span v-show="!sidebarRelated?.collapsed" class="user-trigger-name">{{ user.name }}</span>
        </div>
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
  </div>
</template>

<script setup lang="tsx">
// tsx doesn't require manual imports
import 'element-plus/es/components/menu/style/css';
import 'element-plus/es/components/menu-item/style/css';
import 'element-plus/es/components/sub-menu/style/css';
import { ref, h, watch, inject, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { resolve } from 'pathe'; // ES code implementation of the Path package
import Scrollbar from '../components/Scrollbar.vue';
import { RouterLink } from 'vue-router';
import type { Component, Slots } from 'vue';
import type { RouteMeta, RouteRecordRaw } from 'vue-router';
import { ElMenu, ElMenuItem, ElSubMenu, ElIcon } from 'element-plus/es';
import SvgIcon from '../components/SvgIcon.vue';
import type { Layout } from 'types/layout';
import { userStore } from '../stores/user';
import { Avatar, SwitchButton } from '@element-plus/icons-vue';

const SidebarElIcon = ElIcon as any;
const SidebarElSubMenu = ElSubMenu as any;
const SidebarElMenuItem = ElMenuItem as any;
const SidebarSvgIcon = SvgIcon as any;
const SidebarRouterLink = RouterLink as any;

const router = useRouter();
const route = useRoute();
const user = userStore();

const defaultActive = ref<string>(route.path); // default selected item in the menu
const defaultOpeneds = ref<string[]>(
  router
    .getRoutes()
    .filter(
      (matchedRoute) => matchedRoute.children.length > 0 && /^\/\w+?$/.test(matchedRoute.path)
    )
    .map((matchedRoute) => matchedRoute.path)
); // default expanded item in the submenu

const sidebarRelated = inject<Layout.SidebarRelated>('sidebarRelated');
const keepAlivePages = inject<Layout.keepAlivePages>('keepAlivePages');
const routesList = computed(() => {
  //on retire la route CarrierSelected du menu
  const filteredRoutes = router.options.routes.filter((route) => route.name !== 'CarrierSelected');
  return filteredRoutes;
});

const loading = inject<Layout.Loading>('loading');

function logout() {
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

watch(
  () => route.path,
  () => {
    defaultActive.value = route.path;
    // If the route sets page caching, then push it into the cache group.
    if (route.meta.keepAlive && !keepAlivePages?.has(route.name as string)) {
      keepAlivePages?.add(route.name as string);
    }
  }
);

const getNavIcon = (item: RouteMeta | undefined) => {
  if (!item || (item && !item.icon)) return null;
  return (
    <SidebarElIcon
      size="0.9rem"
      style="margin-right: 10px; padding: 0.5rem; border-radius: 0.3rem; box-shadow: 0 1.25rem 1.68rem #0000000d; width: auto; height: auto;"
    >
      {typeof item.icon === 'string' ? (
        <SidebarSvgIcon iconName={item.icon as string} />
      ) : (
        h(item?.icon as Component)
      )}
    </SidebarElIcon>
  );
};

const MenuItemLink = (
  props: { route: RouteRecordRaw; url: string },
  { slots }: { slots: Slots }
) => {
  if (props.route.meta?.external) {
    return (
      <a href={props.route.redirect as string} target="_blank" rel="noopener noreferrer">
        {slots.default?.()}
      </a>
    );
  }
  return <SidebarRouterLink to={props.url}>{slots.default?.()}</SidebarRouterLink>;
};

const MenuItemNav = (props: { route: RouteRecordRaw; basePath: string }) => {
  // submenu template
  const subMenuTemplate = (route: RouteRecordRaw) => {
    const slots = {
      title: () => (
        <>
          {getNavIcon(route.meta)}
          <span>{route.meta?.title}</span>
        </>
      ),
    };
    const basePath = resolve(props.basePath, route.path);
    return (
      <SidebarElSubMenu index={basePath} v-slots={slots}>
        {route.children?.map((item) => (
          <MenuItemNav route={item} basePath={basePath}></MenuItemNav>
        ))}
      </SidebarElSubMenu>
    );
  };
  // menu item template
  const menuItemTemplate = (route: RouteRecordRaw) => {
    const slots = {
      title: () => <span>{route.meta?.title}</span>,
    };
    const url = resolve(props.basePath, route.path);
    return (
      <MenuItemLink
        route={route}
        url={url}
        v-slots={{
          default: () => (
            <SidebarElMenuItem index={url} v-slots={slots}>
              {getNavIcon(route.meta)}
            </SidebarElMenuItem>
          ),
        }}
      ></MenuItemLink>
    );
  };
  return props.route.meta?.hidden ? (
    <div style="display: none"></div>
  ) : props.route.children &&
    props.route.children.filter((route: RouteRecordRaw) => !route.meta?.hidden).length > 0 ? (
    props.route.children.filter((route: RouteRecordRaw) => !route.meta?.hidden).length > 1 ? (
      subMenuTemplate(props.route)
    ) : (
      menuItemTemplate(getOnlyChildPath(props.route))
    )
  ) : (
    menuItemTemplate(props.route)
  );
};

function getOnlyChildPath(parentRoute: RouteRecordRaw): RouteRecordRaw {
  const childRoute = parentRoute.children?.find((route: RouteRecordRaw) => !route.meta?.hidden);
  return Object.assign({}, childRoute, {
    path: `${parentRoute.path}/${childRoute?.path}`,
  } as RouteRecordRaw);
}
</script>

<style lang="postcss">
.menu-vertical {
  width: v-bind('sidebarRelated?.collapsedWidth') !important;
}

.menu-vertical:not(.el-menu--collapse) {
  width: v-bind('sidebarRelated?.width') !important;
  padding-left: calc(
    var(--el-menu-expand-base-level-padding) + var(--el-menu-level) * var(--el-menu-level-padding)
  );
  padding-right: 1rem;
}

.SideBar-logout-container {
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  position: sticky;
  bottom: 0;
  width: 100%;
  background-color: #ffffff;
}

.sidebar-user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.sidebar-user-trigger:hover {
  background-color: #f5f5f7;
}

.user-avatar-icon {
  font-size: 20px;
  color: #626aef;
}

.user-trigger-name {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-profile-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.user-profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #626aef 0%, #8b5cf6 100%);
  color: #fff;
  flex-shrink: 0;
}

.user-profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-profile-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-profile-email {
  font-size: 12px;
  color: #86868b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-profile-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-detail-label {
  font-size: 12px;
  color: #86868b;
  font-weight: 500;
}

.user-detail-value {
  font-size: 12px;
  color: #1d1d1f;
  font-weight: 600;
}

.user-role-badge {
  background: #f0edff;
  color: #626aef;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.user-profile-footer {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.logout-btn {
  width: 100%;
  border-radius: 8px;
  font-weight: 500;
}

.sidebar-user-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333333;
}

.sideBar-logout-container {
  display: flex;
  align-items: center;
  justify-conter: center;
}
</style>
