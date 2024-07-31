import { createRouter, createWebHistory } from "vue-router";
import Layout from "@/layout/index.vue";
import {Link,} from "@element-plus/icons-vue";
import type { RouteRecordRaw } from "vue-router";
import { ROUTES } from "@/constants/routes";


const routerHistory = createWebHistory(import.meta.env.BASE_URL);

export const routes: Array<RouteRecordRaw> = [
  {
    ...ROUTES.Dashboard,
    component: Layout,
    redirect: "/",
    meta: { title: "Planning", askBeforeCloseTab: true },
    children: [
      {
        path: "",
        component: () => import("@/views/dashboard.vue"),
        meta: { title: "Planning", icon: Link },
      },
    ],
  },
  {
    ...ROUTES.Settings,
    component: Layout,
    //redirect: '/customer/index',
    children: [
      {
        path: "",
        name: "settings",
        component: () => import("@/views/settings/settings.vue"),
        meta: { title: "Paramètres", icon: Link, askBeforeCloseTab: true },
      },
    ],
  },

  
  {
    ...ROUTES.Login,
    component: () => import("@/views/login.vue"),
    meta: { hidden: true, title: "login" },
  },
  {
    ...ROUTES.Redirect,
    meta: { hidden: true, title: "page redirection", hiddenTab: true },
    children: [
      {
        path: "/redirect/:path(.*)",
        component: () => import("@/views/redirect.vue"),
      },
    ],
  },
  {
    path: "/404",
    component: () => import("@/views/404.vue"),
    meta: { hidden: true, title: "404" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/404",
    meta: { hidden: true },
  },
];

export const router = createRouter({
  history: routerHistory,
  scrollBehavior: (): { top: number } => ({ top: 0 }),
  routes,
});
